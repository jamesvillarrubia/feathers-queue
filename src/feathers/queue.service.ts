/**
 * @feathers-cloud/task-queue
 * 
 * Feathers service wrapper for the queue system.
 * This service provides a RESTful interface to interact with the queue.
 */

import { Id, NullableId, Params, ServiceMethods } from '@feathersjs/feathers';
import { BadRequest, MethodNotAllowed } from '@feathersjs/errors';
import { QueueManager } from '../core/queue/queue-manager.class';
import { Task, TaskOptions } from '../core/types/task.types';

export interface QueueServiceOptions {
  queueManager: QueueManager;
}

export interface QueueParams extends Params {
  queue?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export class QueueService implements ServiceMethods<Task> {
  private queueManager: QueueManager;

  constructor(options: QueueServiceOptions) {
    this.queueManager = options.queueManager;
  }

  /**
   * Find tasks in the queue
   * Not implemented - use get() for individual tasks
   */
  async find(_params?: QueueParams): Promise<Task[]> {
    throw new MethodNotAllowed('Method not allowed');
  }

  /**
   * Get a task by ID
   * Not implemented - tasks are transient
   */
  async get(_id: Id, _params?: QueueParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  /**
   * Create a new task in the queue
   */
  async create(data: Task, params?: QueueParams): Promise<Task> {
    if (!data.type || !data.payload) {
      throw new BadRequest('Task must have a type and payload');
    }

    const options: TaskOptions = {
      priority: data.metadata?.priority,
      scheduledFor: data.metadata?.scheduledFor,
      maxRetries: data.metadata?.maxRetries,
      retryDelay: data.metadata?.retryDelay,
    };

    const taskId = await this.queueManager.enqueue(data, {
      ...options,
      queue: params?.queue,
    });

    return {
      ...data,
      id: taskId,
    };
  }

  /**
   * Update a task in the queue
   * Not implemented - tasks are immutable
   */
  async update(_id: Id, _data: Task, _params?: QueueParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  /**
   * Patch a task in the queue
   * Not implemented - tasks are immutable
   */
  async patch(_id: NullableId, _data: Partial<Task>, _params?: QueueParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  /**
   * Remove a task from the queue
   * Not implemented - use dead letter queue for failed tasks
   */
  async remove(_id: Id, _params?: QueueParams): Promise<Task> {
    throw new MethodNotAllowed('Method not allowed');
  }

  /**
   * Get queue statistics
   */
  async getStats(queueName?: string): Promise<QueueStats | Record<string, QueueStats>> {
    const stats = await this.queueManager.getStats();
    if (queueName) {
      const queueStats = stats[queueName];
      if (!queueStats) {
        throw new BadRequest(`Queue "${queueName}" not found`);
      }
      return queueStats;
    }
    return stats;
  }

  /**
   * Setup the service
   * This method is called by Feathers when the service is registered
   */
  async setup(): Promise<void> {
    // Nothing to do here since the queue manager is already initialized
  }
} 