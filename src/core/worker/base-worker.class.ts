/**
 * @feathers-cloud/task-queue
 * 
 * Base worker class that implements the WorkerInterface and provides common functionality
 * for all worker implementations.
 */

import { Application } from '@feathersjs/feathers';
import { WorkerInterface, WorkerOptions } from '../interfaces/worker.interface';
import { Task, TaskHandlerMap, TaskResult } from '../types/task.types';
import { QueueInterface } from '../interfaces/queue.interface';

type WorkerConfig = {
  maxConcurrentTasks: number;
  pollInterval: number;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
};

export abstract class BaseWorker implements WorkerInterface {
  protected app: Application;
  protected queue: QueueInterface;
  protected handlers: TaskHandlerMap = {};
  protected config: WorkerConfig = {
    maxConcurrentTasks: 10,
    pollInterval: 1000,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  };
  protected isRunning: boolean = false;
  protected activeTasks: Set<string> = new Set();
  protected processedTasks: number = 0;
  protected failedTasks: number = 0;
  protected totalProcessingTime: number = 0;

  constructor(options: WorkerOptions) {
    this.app = options.app;
    this.queue = options.queue;
    this.handlers = options.handlers;
    if (options.config) {
      this.config = {
        ...this.config,
        ...options.config,
        retryPolicy: {
          ...this.config.retryPolicy,
          ...options.config.retryPolicy,
        },
      };
    }
  }

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    await this.validateHandlers();
    await this.setupWorker();
  }

  /**
   * Validate that all required handlers are registered
   */
  protected abstract validateHandlers(): Promise<void>;

  /**
   * Set up the worker infrastructure
   */
  protected abstract setupWorker(): Promise<void>;

  /**
   * Start processing tasks
   */
  abstract start(): Promise<void>;

  /**
   * Stop processing tasks
   */
  abstract stop(): Promise<void>;

  /**
   * Process a single task
   */
  async processTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    this.activeTasks.add(task.id);

    try {
      const handler = this.handlers[task.type];
      if (!handler) {
        throw new Error(`No handler registered for task type: ${task.type}`);
      }

      const result = await handler(task);
      this.processedTasks++;
      return result;
    } catch (error) {
      this.failedTasks++;
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    } finally {
      this.activeTasks.delete(task.id);
      this.totalProcessingTime += Date.now() - startTime;
    }
  }

  /**
   * Register a new task handler
   */
  registerHandler(type: string, handler: (task: Task) => Promise<TaskResult>): void {
    this.handlers[type] = handler;
  }

  /**
   * Get worker statistics
   */
  async getStats(): Promise<{
    activeTasks: number;
    processedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
  }> {
    return {
      activeTasks: this.activeTasks.size,
      processedTasks: this.processedTasks,
      failedTasks: this.failedTasks,
      averageProcessingTime: this.processedTasks > 0
        ? this.totalProcessingTime / this.processedTasks
        : 0,
    };
  }
} 