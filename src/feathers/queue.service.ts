/**
 * @feathers-cloud/task-queue
 * 
 * Feathers service wrapper for the queue system.
 * This service provides a RESTful interface to interact with the queue.
 */

import { Id, NullableId, Params, Application, ServiceInterface } from '@feathersjs/feathers';
import { BadRequest, MethodNotAllowed } from '@feathersjs/errors';
import { GCPQueue,  queueFactory } from '../providers/gcp/gcp-queue.class';
import { Task, TaskOptions } from '../core/types/task.types';
import { debugService } from '../core/utils/debug';
import { FeathersQueueConfig } from '../core/interfaces/queue.interface';
import type { QueueQuery } from '../core/schemas/queue.schema';


export interface QueueServiceOptions {
  app: Application;
  config: FeathersQueueConfig;
}


export interface QueueParams extends Params<QueueQuery> {}

/**
 * QueueService class that implements the FeathersJS ServiceInterface
 * This service provides a RESTful interface to interact with the queue.
 */
export class QueueService<ServiceParams extends QueueParams = QueueParams> 
  implements ServiceInterface<Task, Task, ServiceParams, Task> {

  private queue: GCPQueue;
  private queues: Record<string, GCPQueue> = {};
  private defaultQueueName: string = 'default';
  public options: QueueServiceOptions;

  constructor(options: QueueServiceOptions) {
    this.options = options;
    
    if (options.config.provider === 'gcp') {
      // Create the main queue instance
      this.queue = new GCPQueue(options.config.defaults);
      
      // Initialize the queues if routing is enabled
      if (options.config.routing) {
        this.queues = queueFactory(options.config);
        this.defaultQueueName = options.config.defaults?.defaultQueue || 'default';
      }
    } else {
      throw new Error(`Provider ${options.config.provider} is not supported`);
    }
  }

  /**
   * Get the appropriate queue for a task based on the queueName in the task options
   * @param task The task to enqueue
   * @param options Optional task options
   * @returns The queue to use for this task
   */
  private getQueueForTask(task: Task, options?: TaskOptions): GCPQueue {
    // If we have multiple queues configured, use the queue specified in the task options
    if (Object.keys(this.queues).length > 0) {
      const queueName = options?.queueName || task.type || this.defaultQueueName;
      
      if (this.queues[queueName]) {
        return this.queues[queueName];
      }
      
      // If the specified queue doesn't exist, fall back to the default queue
      debugService(`Queue "${queueName}" not found, falling back to default queue "${this.defaultQueueName}"`);
      return this.queues[this.defaultQueueName] || this.queue;
    }
    
    // If we don't have multiple queues, just use the main queue
    return this.queue;
  }

  async find(params?: ServiceParams): Promise<Task[]> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async get(id: Id, params?: ServiceParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async create(data: Task, params?: ServiceParams): Promise<Task>;
  async create(data: Task[], params?: ServiceParams): Promise<Task[]>;
  async create(data: Task | Task[], params?: ServiceParams): Promise<Task | Task[]> {
    // Handle array of tasks
    if (Array.isArray(data)) {
      return Promise.all(data.map(task => this.createSingleTask(task, params)));
    }
    
    // Handle single task
    return this.createSingleTask(data, params);
  }

  private async createSingleTask(data: Task, params?: ServiceParams): Promise<Task> {
    // An example task might look like this:
    // {
    //   id: '123',
    //   type: 'queue-name',
    //   payload: { message: 'Hello, world!' },
    //   options: { 
    //     targetUrl: 'https://example.com/api/v1/task',
    //     priority: 5
    //   }
    // }

    if (!data.payload) {
      throw new BadRequest('Task payload is required');
    }

    // Generate a task ID if not provided
    if (!data.id) {
      data.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Get the appropriate queue for this task
    const queue = this.getQueueForTask(data, data.options);
    
    // Enqueue the task
    const taskId = await queue.enqueue(data, data.options);
    
    // Return the task with the task ID
    return {
      ...data,
      id: taskId,
    };
  }

  async patch(id: Id, data: Partial<Task>, params?: ServiceParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async update(id: Id, data: Task, params?: ServiceParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async remove(id: NullableId, params?: ServiceParams): Promise<Task> {
    // Get the appropriate queue for this task
    const queue = this.getQueueForTask({ 
      id: id as string, 
      type: 'cleanup', 
      payload: {} 
    } as Task);
    
    // Clean up the queue
    await queue.cleanup();
    
    return {
      id: 'queue-cleanup',
      type: 'queue-cleanup',
      payload: { success: true }
    } as Task;
  }

  // async getStats(): Promise<QueueStats> {
  //   // Get the appropriate queue for this task
  //   const queue = this.getQueueForTask({ id: 'stats', type: 'stats', data: {} } as Task);
    
  //   // Get the queue stats
  //   return queue.getStats();
  // }

  setup(app: Application): Promise<void> {
    // Set up the main queue
    return this.queue.setupQueue().then(async () => {
      // Set up all the other queues if they exist
      for (const queueName in this.queues) {
        await this.queues[queueName].setupQueue();
      }
    });
  }
}

export function getOptions(app: Application): QueueServiceOptions {
  return {
    app: app,
    config: app.get('feathers-queue') as FeathersQueueConfig
  };
}