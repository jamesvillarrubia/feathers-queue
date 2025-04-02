/**
 * @feathers-cloud/task-queue
 * 
 * Core worker interface that defines how workers process tasks.
 */

import { Application } from '@feathersjs/feathers';
import { Task, TaskHandlerMap, TaskResult } from '../types/task.types';
import { QueueInterface } from './queue.interface';

export interface WorkerOptions {
  app: Application;
  queue: QueueInterface;
  handlers: TaskHandlerMap;
  config?: {
    maxConcurrentTasks?: number;
    pollInterval?: number;
    retryPolicy?: {
      maxRetries?: number;
      retryDelay?: number;
    };
  };
}

export interface WorkerInterface {
  /**
   * Initialize the worker with configuration
   */
  initialize(options: WorkerOptions): Promise<void>;

  /**
   * Start processing tasks from the queue
   */
  start(): Promise<void>;

  /**
   * Stop processing tasks
   */
  stop(): Promise<void>;

  /**
   * Process a single task
   */
  processTask(task: Task): Promise<TaskResult>;

  /**
   * Register a new task handler
   */
  registerHandler(type: string, handler: (task: Task) => Promise<TaskResult>): void;

  /**
   * Get worker statistics
   */
  getStats(): Promise<{
    activeTasks: number;
    processedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
  }>;
} 