/**
 * @feathers-cloud/task-queue
 * 
 * QueueRouter class that routes tasks to different queues based on the queueName field.
 * This class implements the FeathersJS ServiceInterface to be compatible with app.use().
 */

import { Id, NullableId, Params, ServiceInterface, Application } from '@feathersjs/feathers';
import { BadRequest, MethodNotAllowed } from '@feathersjs/errors';
import { Task, TaskOptions } from '../core/task.types';
import { QueueQuery } from '../core/queue.schema';
import { debugService } from '../utils/debug';
import { LibraryConfig } from '../core/queue.types';

export interface QueueRouterOptions {
  app: Application;
  config: LibraryConfig;
}

export interface QueueRouterParams extends Params<QueueQuery> {}

/**
 * QueueRouter class that implements the FeathersJS ServiceInterface
 * This class routes tasks to different queues based on the queueName field.
 */
export class QueueRouter<ServiceParams extends QueueRouterParams = QueueRouterParams>
  implements ServiceInterface<Task, Task, ServiceParams, Task> {

  private queues: Record<string, any>;
  private defaultQueueName: string;
  public options: QueueRouterOptions;

  constructor(options: QueueRouterOptions) {
    this.options = options;
    this.queues = options.config.queues;
    this.defaultQueueName = options.config.defaults?.defaultQueue || 'default';
  }

  /**
   * Get the appropriate queue for a task based on the queueName in the task options
   * @param task The task to route
   * @param options Optional task options
   * @returns The queue to use for this task
   */
  private getQueueForTask(task: Task, options?: TaskOptions): any {
    const queueName = options?.queueName || task.queueName || this.defaultQueueName;
    
    if (this.queues[queueName]) {
      return this.queues[queueName];
    }
    
    // If the specified queue doesn't exist, fall back to the default queue
    debugService(`Queue "${queueName}" not found, falling back to default queue "${this.defaultQueueName}"`);
    return this.queues[this.defaultQueueName];
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
      return Promise.all(data.map(task => this.create(task, params)));
    }
    

    // Generate a task ID if not provided
    if (!data.id) {
      data.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Get the appropriate queue for this task
    const queue = this.getQueueForTask(data as Task, data.options);
    
    // Enqueue the task
    const taskId = await queue.enqueue(data as Task, data.options);
    
    // Return the task with the task ID
    return {
      ...data,
      id: taskId,
    } as Task;
  }

  async patch(id: Id, data: Partial<Task>, params?: ServiceParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async update(id: Id, data: Task, params?: ServiceParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  async remove(id: NullableId, params?: ServiceParams): Promise<Task> {

    throw new MethodNotAllowed('Method not allowed');

    // // Get the appropriate queue for this task
    // const queue = this.getQueueForTask({ id: id as string, type: 'cleanup', payload: {} } as Task);
    
    // // Clean up the queue
    // await queue.cleanup();
    
    // return {
    //   id: 'queue-cleanup',
    //   type: 'queue-cleanup',
    //   payload: { success: true }
    // };
  }

  async setup(app: Application): Promise<void> {
    // Set up all the queues
    for (const queueName in this.queues) {
      if (typeof this.queues[queueName].setupQueue === 'function') {
        await this.queues[queueName].setupQueue();
      }
    }
  }
} 