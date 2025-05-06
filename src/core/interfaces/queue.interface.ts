/**
 * @feathers-cloud/task-queue
 * 
 * Core queue interface that defines the contract for all queue implementations.
 * This interface ensures consistent behavior across different cloud providers.
 */

import { Application } from '@feathersjs/feathers';
import { Task, TaskOptions, TaskResult } from '../types/task.types';
import { ChannelCredentials } from '@grpc/grpc-js';

export interface FeathersQueueConfig {
  app: Application;
  routing: boolean;
  provider: 'gcp' | 'aws' | 'azure';
  defaults: SingleQueueConfig;
  queues: Record<string, SingleQueueConfig>;
  
  // Emulator settings
  emulator?: {
    host: string;
    port: string;
    credentials?: ChannelCredentials;
  };
}

export interface SingleQueueConfig {
  app?: Application;
  name?: string;
  defaultQueue?: string;
  allowedDomains?: string[];
  provider: string;
  projectId: string;
  location: string;
  maxRetries?: number;
  retryDelay?: number;
  deadLetterQueue?: string;
  serviceAccountEmail?: string;
  taskHandlerUrl?: string;
  handlerRootPath?: string;
  emulator?: {
    host: string;
    port: string;
  };
  // AWS specific properties
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  queueUrl?: string;
  // Azure specific properties
  connectionString?: string;
  queueName?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface QueueInterface {
  /**
   * Initialize the queue with configuration
   */
  initialize(config: SingleQueueConfig): Promise<void>;

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
  getStats(): Promise<QueueStats>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;
} 