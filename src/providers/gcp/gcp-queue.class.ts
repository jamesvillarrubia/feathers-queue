import { BaseQueue } from '../../core/base-queue.class';
import { QueueInterface, QueueStats } from '../../core/queue.types';
import { LibraryConfig, QueueConfig } from '../../core/queue.types';
import { Task, TaskOptions } from '../../core/task.types';
import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { credentials } from '@grpc/grpc-js';
import { URL } from 'url';
import { debugGCP, debugTask, logTaskCreation, formatDebug } from '../../utils/debug';
import { Application } from '@feathersjs/feathers';
import { GCPQueueStats } from './gcp-queue.types';


export interface QueueStatsResult {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

type IQueue = protos.google.cloud.tasks.v2.IQueue & {
  stats?: {
    tasksCount?: string | number;
    concurrentDispatchesCount?: string | number;
    executedLastMinuteCount?: string | number;
    unackedTasksCount?: string | number;
    oldestTask?: protos.google.protobuf.ITimestamp;
  };
  rateLimits?: {
    maxDispatchesPerSecond?: number;
    maxBurstSize?: number;
    maxConcurrentDispatches?: number;
  };
  retryConfig?: {
    maxAttempts?: number;
    maxRetryDuration?: { seconds?: number };
    minBackoff?: { seconds?: number };
    maxBackoff?: { seconds?: number };
    maxDoublings?: number;
  };
};

export interface GCPQueueOptions extends QueueConfig {
  projectId: string;
  location: string;
  serviceAccountEmail?: string;
  emulator?: {
    host: string;
    port: string;
  };
  queueName: string;
  taskHandlerUrl?: string;
  handlerRootPath?: string;
  maxRetries?: number;
  priority?: number;
  scheduledFor?: number;
  exactlyOnce?: boolean;
  allowedDomains?: string[];
  enhancedStats?: boolean;
}

/**
 * Creates a map of queue instances from a FeathersQueueConfig
 * @param config The FeathersQueueConfig containing queue configurations
 * @returns A map of queue instances keyed by queue name
 */
export function queueFactory(config: LibraryConfig): Record<string, GCPQueue> {
  const queues: Record<string, GCPQueue> = {};
  
  // Create a queue for each entry in the queues object
  for (const queueName in config.queues) {
    const queueConfig = config.queues[queueName];
    
    // Merge with defaults if they exist
    const mergedConfig = {
      ...config.defaults,
      ...queueConfig,
      name: queueName, // Ensure the queue name is set correctly
    } as unknown as GCPQueueOptions;
    
    queues[queueName] = new GCPQueue(mergedConfig);
  }
  
  return queues;
}

export class GCPQueue extends BaseQueue implements QueueInterface {
  private client: CloudTasksClient;
  private projectId: string;
  private location: string;
  private serviceAccountEmail?: string;
  private taskHandlerUrl?: string;
  private handlerRootPath?: string;
  private allowedDomains: string[] = [];
  private queues: Record<string, GCPQueue> = {};
  private defaultQueueName: string = 'default';
  private queueName: string;
  private enhancedStats: boolean;

  constructor(options: GCPQueueOptions) {
    // Ensure queueName is always defined
    const queueName = options.queueName || 'default';
    
    // Create a QueueOptions object from the SingleQueueConfig
    const queueOptions: LibraryConfig = {
      app: options.app as Application,
      routing: false,
      provider: 'gcp' as const,
      name: options.name || 'default',
      defaults: {
        ...options,
        queueName,
        defaultQueue: queueName
      },
      queues: {
        [options.name || 'default']: {
          ...options,
          queueName
        }
      }
    };
    
    super(queueOptions.defaults);
    
    this.projectId = options.projectId || '';
    this.location = options.location || '';
    this.serviceAccountEmail = options.serviceAccountEmail;
    this.taskHandlerUrl = options.taskHandlerUrl;
    this.handlerRootPath = options.handlerRootPath;
    this.allowedDomains = options.allowedDomains || [];
    this.defaultQueueName = options.queueName || 'default';
    this.queueName = options.name || this.defaultQueueName;
    this.enhancedStats = options.enhancedStats || false;
    
    // Set up the Cloud Tasks client
    if (options.emulator) {
      const { host, port } = options.emulator;
      if (!host || !port) {
        throw new Error('Invalid emulator configuration: host and port are required');
      }
      
      try {
        // Set emulator environment variables
        process.env.CLOUD_TASKS_EMULATOR = 'true';
        process.env.GOOGLE_CLOUD_PROJECT = this.projectId;
        process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${host}:${port}`;
        process.env.GOOGLE_APPLICATION_CREDENTIALS = 'fake-credentials.json';
        
        debugGCP(`Connecting to Cloud Tasks emulator at ${host}:${port}`);
        
        this.client = new CloudTasksClient({
          port: parseInt(port),
          servicePath: host,
          sslCreds: credentials.createInsecure(),
        });
      } catch (error: any) {
        debugGCP('Failed to connect to emulator: %s', error.message);
        throw new Error(`Failed to connect to emulator: ${error.message}`);
      }
    } else {
      // For production, use default credentials
      this.client = new CloudTasksClient({
        fallback: true
      });
    }
    
    // Set the queue name in the config
    this.config.name = options.name || this.defaultQueueName;
  }

  /**
   * Initialize multiple queues from a FeathersQueueConfig
   * @param config The FeathersQueueConfig containing queue configurations
   */
  public initializeQueues(config: LibraryConfig): void {
    this.queues = queueFactory(config);
    this.defaultQueueName = config.defaults?.defaultQueue || 'default';
  }

  protected async validateConfig(): Promise<void> {
    if (!this.projectId) {
      throw new Error('GCP project ID is required');
    }
    if (!this.location) {
      throw new Error('GCP location is required');
    }
    if (!this.queueName) {
      throw new Error('queue name is required for GCP Queue');
    }
    if (!this.taskHandlerUrl && !this.config.taskHandlerUrl && !process.env.TASK_HANDLER_URL) {
      throw new Error('Task handler URL is required. Set it in options.taskHandlerUrl, config.taskHandlerUrl or TASK_HANDLER_URL environment variable');
    }
  }

  async setupQueue(): Promise<void> {
    debugGCP('Setting up queue...');

    await this.validateConfig();
    
    const parent = this.client.queuePath(
      this.projectId,
      this.location,
      this.queueName
    );
    debugGCP('Queue path: %s', parent);

    // Default queue configuration
    const defaultConfig = {
      rateLimits: {
        maxDispatchesPerSecond: 500,
        maxBurstSize: 100,
        maxConcurrentDispatches: 1000
      },
      retryConfig: {
        maxAttempts: this.config.maxRetries || 3,
        maxRetryDuration: { seconds: 3600 },
        minBackoff: { seconds: 0.1 },
        maxBackoff: { seconds: 3600 },
        maxDoublings: 16
      }
    };

    try {
      debugGCP('Attempting to get existing queue...');
      // Try to get existing queue
      let response = await this.client.getQueue({ name: parent });
      debugGCP('Queue exists: %O', response);
    } catch (error: any) {
      // If queue doesn't exist, create it
      try {
        debugGCP('Queue not found, creating new queue...');
        const locationPath = this.client.locationPath(this.projectId, this.location);
        await this.client.createQueue({
          parent: locationPath,
          queue: {
            name: parent,
            ...defaultConfig
          }
        });
        debugGCP('Queue created successfully');
      } catch (createError: any) {
        debugGCP('Create queue error: %s', createError?.message);
        throw createError;
      }
    }
  }

  protected validateTask(task: Task): void {
    if (!task || typeof task !== 'object') {
      throw new Error('Task must be a valid object');
    }
    
    // Task ID is optional - GCP will generate one if not provided
    if (task.id !== undefined && typeof task.id !== 'string') {
      throw new Error('Task ID must be a string if provided');
    }

    if (!task.type || typeof task.type !== 'string') {
      throw new Error('Task must have a valid type (queue name)');
    }
    
    if (task.payload === undefined) {
      throw new Error('Task must have a payload');
    }
  }

  /**
   * Validate that the domain is in the allowed list
   */
  private validateDomain(url: string): void {
    if (!this.allowedDomains || this.allowedDomains.length === 0) {
      return; // No domains to validate against
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Check if the hostname matches any of the allowed domains
      const isAllowed = this.allowedDomains.some(domain => {
        // Exact match
        if (hostname === domain) return true;
        
        // Subdomain match (e.g., subdomain.ngrok.io matches ngrok.io)
        if (hostname.endsWith(`.${domain}`)) return true;
        
        return false;
      });

      if (!isAllowed) {
        throw new Error(`Domain "${hostname}" is not in the allowed list. Allowed domains: ${this.allowedDomains.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Domain')) {
        throw error;
      }
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Get the appropriate queue for a task based on the queueName in the task options
   * @param task The task to enqueue
   * @param options Optional task options
   * @returns The queue to use for this task
   */
  private getQueueForTask(task: Task, options?: TaskOptions): GCPQueue {
    // If a specific queue name is provided in options, use that
    const queueName = options?.queueName || task.type || this.defaultQueueName;
    
    // If the queue exists in our map, return it
    if (this.queues[queueName]) {
      return this.queues[queueName];
    }
    
    // Otherwise, return this queue
    return this;
  }

  async enqueue(task: Task, options?: TaskOptions): Promise<string> {
    try {
      // Validate the task first
      this.validateTask(task);
      
      await this.validateConfig();
      
      const queue = this.getQueueForTask(task, options);
      const parent = this.client.queuePath(
        this.projectId,
        this.location,
        queue.queueName
      );

      // Get the target URL from options or use the default
      let taskHandlerUrl = options?.targetUrl || this.config.taskHandlerUrl;
      
      // If no target URL is provided, throw an error
      if (!taskHandlerUrl) {
        throw new Error('Task must have a targetUrl in options or queue configuration');
      }
      
      // Validate the domain
      this.validateDomain(taskHandlerUrl);

      debugGCP(`Creating task with handler URL: ${taskHandlerUrl}`);

      // Log the task payload
      debugTask('Task payload: %s', formatDebug(task.payload || {}));

      // Create the task based on the example code
      const taskRequest: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
        parent,
        task: {
          httpRequest: {
            httpMethod: 'POST' as const,
            url: taskHandlerUrl,
            headers: {
              'Content-Type': 'application/json',
              'X-Task-Type': task.type || '',
              'X-Task-Priority': (options?.priority || 5).toString(),
            },
            body: Buffer.from(JSON.stringify(task.payload || {})).toString('base64'),
            ...(this.serviceAccountEmail && {
              oidcToken: {
                serviceAccountEmail: this.serviceAccountEmail,
              },
            }),
          },
          scheduleTime: options?.scheduledFor
            ? {
                seconds: Math.floor(options.scheduledFor / 1000),
              }
            : undefined,
        },
      };

      try {
        debugGCP('Sending task: %s', formatDebug(taskRequest));
        const [response] = await this.client.createTask(taskRequest);
        if (!response.name) {
          throw new Error('Failed to create task: No task name returned');
        }
        debugGCP(`Created task ${response.name}`);
        
        // Log task creation using our helper
        logTaskCreation(task, options);
        
        return response.name;
      } catch (error: any) {
        debugGCP('Error creating task: %s', error.message);
        throw error;
      }
    } catch (error) {
      debugGCP('Error in enqueue: %s', error);
      throw error;
    }
  }

  async dequeue(): Promise<Task | null> {
    // GCP Cloud Tasks handles dequeuing automatically via HTTP callbacks
    return null;
  }

  async acknowledge(_taskId: string): Promise<void> {
    // GCP Cloud Tasks handles acknowledgments automatically via HTTP callbacks
    return;
  }

  async deadLetter(_taskId: string, _error: Error): Promise<void> {
    // GCP Cloud Tasks handles dead lettering automatically via retry config
    return;
  }

  async getStats(): Promise<QueueStats> {
    try {
      const queuePath = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      const [queue] = await this.client.getQueue({ name: queuePath });
      const queueWithStats = queue as IQueue;
      
      // Create the base stats that all providers must implement
      const baseStats: QueueStats = {
        pending: Number(queueWithStats.stats?.tasksCount || 0),
        processing: Number(queueWithStats.stats?.concurrentDispatchesCount || 0),
        completed: Number(queueWithStats.stats?.executedLastMinuteCount || 0),
        failed: 0 // GCP doesn't provide failed task count
      };

      // If enhanced stats are enabled, return the enhanced version
      if (this.enhancedStats) {
        const enhancedStats: GCPQueueStats = {
          ...baseStats,
          unackedTasksCount: Number(queueWithStats.stats?.unackedTasksCount || 0),
          oldestTask: queueWithStats.stats?.oldestTask?.toString(),
          rateLimits: queueWithStats.rateLimits ? {
            maxDispatchesPerSecond: Number(queueWithStats.rateLimits.maxDispatchesPerSecond || 0),
            maxBurstSize: Number(queueWithStats.rateLimits.maxBurstSize || 0),
            maxConcurrentDispatches: Number(queueWithStats.rateLimits.maxConcurrentDispatches || 0)
          } : undefined,
          retryConfig: queueWithStats.retryConfig ? {
            maxAttempts: Number(queueWithStats.retryConfig.maxAttempts || 0),
            maxRetryDuration: Number(queueWithStats.retryConfig.maxRetryDuration?.seconds || 0),
            minBackoff: Number(queueWithStats.retryConfig.minBackoff?.seconds || 0),
            maxBackoff: Number(queueWithStats.retryConfig.maxBackoff?.seconds || 0),
            maxDoublings: Number(queueWithStats.retryConfig.maxDoublings || 0)
          } : undefined
        };
        return enhancedStats;
      }

      // Otherwise return just the base stats
      return baseStats;
    } catch (error) {
      debugGCP('Error getting queue stats: %s', error);
      // Return empty stats rather than throwing error
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }
  }

  async cleanup(): Promise<void> {
    const queuePath = this.client.queuePath(
      this.projectId,
      this.location,
      this.queueName
    );
    await this.client.purgeQueue({ name: queuePath });
  }
} 

export const getGCPQueueOptions = (app: Application, queueName?: string): LibraryConfig => {
  const feathersQueueConfig = app.get('feathers-queue') as LibraryConfig;
  const isRouting = !!feathersQueueConfig.routing;

  if(isRouting) {
    return feathersQueueConfig
  }else{
    if(!queueName) {
      throw new Error('Queue name is required when routing is disabled');
    }
    if(!feathersQueueConfig.queues[queueName]) {
      throw new Error(`Queue configuration not found for queue: ${queueName}`);
    }

    // Create a new config with the selected queue
    const selectedQueue = feathersQueueConfig.queues[queueName];
    return {
      ...feathersQueueConfig,
      queues: {
        [queueName]: selectedQueue
      }
    }
  }  
}