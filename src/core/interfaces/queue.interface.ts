/**
 * @feathers-cloud/task-queue
 * 
 * Core queue interface that defines the contract for all queue implementations.
 * This interface ensures consistent behavior across different cloud providers.
 */

import { Application } from '@feathersjs/feathers';
import { Task, TaskOptions, TaskResult } from '../types/task.types';

export interface QueueOptions {
  app: Application;
  configPath?: string;
  provider?: 'gcp' | 'aws' | 'azure' | 'local';
}

export interface QueueConfig {
  name: string;
  maxRetries?: number;
  retryDelay?: number;
  deadLetterQueue?: string;
  rateLimit?: {
    maxTasksPerSecond?: number;
    maxConcurrentTasks?: number;
  };
}

export interface QueueInterface {
  /**
   * Initialize the queue with configuration
   */
  initialize(config: QueueConfig): Promise<void>;

  /**
   * Add a task to the queue
   */
  enqueue(task: Task, options?: TaskOptions): Promise<string>;

  /**
   * Process a task from the queue
   */
  dequeue(): Promise<Task | null>;

  /**
   * Acknowledge successful task processing
   */
  acknowledge(taskId: string): Promise<void>;

  /**
   * Move a failed task to the dead letter queue
   */
  deadLetter(taskId: string, error: Error): Promise<void>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;
} 