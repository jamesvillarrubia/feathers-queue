/**
 * @feathers-cloud/task-queue
 * 
 * Base queue class that implements the QueueInterface and provides common functionality
 * for all queue implementations.
 */

import { Application } from '@feathersjs/feathers';
import { QueueInterface, QueueOptions, QueueConfig } from '../interfaces/queue.interface';
import { Task, TaskOptions } from '../types/task.types';

export abstract class BaseQueue implements QueueInterface {
  protected app: Application;
  protected configPath: string;
  protected config: QueueConfig = {
    name: 'default',
    maxRetries: 3,
    retryDelay: 1000,
  };
  protected isInitialized: boolean = false;

  constructor(options: QueueOptions) {
    this.app = options.app;
    this.configPath = options.configPath || 'queue';
  }

  /**
   * Initialize the queue with configuration
   */
  async initialize(config: QueueConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Queue already initialized');
    }

    this.config = {
      ...this.config,
      ...config,
    };

    await this.validateConfig();
    await this.setupQueue();
    this.isInitialized = true;
  }

  /**
   * Validate the queue configuration
   */
  protected abstract validateConfig(): Promise<void>;

  /**
   * Set up the queue infrastructure
   */
  protected abstract setupQueue(): Promise<void>;

  /**
   * Add a task to the queue
   */
  abstract enqueue(task: Task, options?: TaskOptions): Promise<string>;

  /**
   * Process a task from the queue
   */
  abstract dequeue(): Promise<Task | null>;

  /**
   * Acknowledge successful task processing
   */
  abstract acknowledge(taskId: string): Promise<void>;

  /**
   * Move a failed task to the dead letter queue
   */
  abstract deadLetter(taskId: string, error: Error): Promise<void>;

  /**
   * Get queue statistics
   */
  abstract getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;

  /**
   * Clean up resources
   */
  abstract cleanup(): Promise<void>;

  /**
   * Validate a task before enqueueing
   */
  protected validateTask(task: Task): void {
    if (!task.id) {
      throw new Error('Task must have an id');
    }
    if (!task.type) {
      throw new Error('Task must have a type');
    }
    if (!task.payload) {
      throw new Error('Task must have a payload');
    }
  }

  /**
   * Merge task options with default configuration
   */
  protected mergeTaskOptions(options?: TaskOptions): TaskOptions {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      ...options,
    };
  }
} 