/**
 * @feathers-cloud/task-queue
 * 
 * Queue manager class that handles multiple queues and provides a unified interface.
 */

import { Application } from '@feathersjs/feathers';
import { QueueInterface } from '../src/core/interfaces/queue.interface';
import { Task, TaskOptions } from '../src/core/types/task.types';

export class QueueManager {
  private app: Application;
  private queues: Map<string, QueueInterface> = new Map();
  private defaultQueue: string = 'default';

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Register a new queue
   */
  registerQueue(name: string, queue: QueueInterface): void {
    if (this.queues.has(name)) {
      throw new Error(`Queue with name "${name}" already exists`);
    }
    this.queues.set(name, queue);
  }

  /**
   * Get a queue by name
   */
  getQueue(name?: string): QueueInterface {
    const queueName = name || this.defaultQueue;
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue with name "${queueName}" not found`);
    }
    return queue;
  }

  /**
   * Set the default queue
   */
  setDefaultQueue(name: string): void {
    if (!this.queues.has(name)) {
      throw new Error(`Queue with name "${name}" not found`);
    }
    this.defaultQueue = name;
  }

  /**
   * Enqueue a task to a specific queue
   */
  async enqueue(task: Task, options?: TaskOptions & { queue?: string }): Promise<string> {
    const queue = this.getQueue(options?.queue);
    return queue.enqueue(task, options);
  }

  /**
   * Dequeue a task from a specific queue
   */
  async dequeue(queueName?: string): Promise<Task | null> {
    const queue = this.getQueue(queueName);
    return queue.dequeue();
  }

  /**
   * Acknowledge a task in a specific queue
   */
  async acknowledge(taskId: string, queueName?: string): Promise<void> {
    const queue = this.getQueue(queueName);
    return queue.acknowledge(taskId);
  }

  /**
   * Move a task to the dead letter queue
   */
  async deadLetter(taskId: string, error: Error, queueName?: string): Promise<void> {
    const queue = this.getQueue(queueName);
    return queue.deadLetter(taskId, error);
  }

  /**
   * Get statistics for all queues
   */
  async getStats(): Promise<Record<string, {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>> {
    const stats: Record<string, any> = {};
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = await queue.getStats();
    }
    return stats;
  }

  /**
   * Clean up all queues
   */
  async cleanup(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.cleanup();
    }
  }
} 