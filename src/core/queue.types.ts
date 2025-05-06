/**
 * @feathers-cloud/task-queue
 * 
 * Core queue interface that defines the contract for all queue implementations.
 * This interface ensures consistent behavior across different cloud providers.
 */

import { Application } from '@feathersjs/feathers';
import { Task } from './task.types';
export interface QueueConfig {
  app: Application;
  provider: 'gcp' | 'aws' | 'azure';
  name: string;
  maxRetries?: number;
  retryDelay?: number;
  deadLetterQueue?: string;
  queueName?: string;
  taskHandlerUrl?: string;
  emulator?: {
    host: string;
    port: string;
  };
}

export interface LibraryConfig {
  app: Application;
  provider: 'gcp' | 'aws' | 'azure';
  name: string;
  queues: Record<string, QueueConfig>;
  defaults: QueueConfig & { defaultQueue: string };
  routing: boolean;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface QueueInterface {
  initialize(config: QueueConfig): Promise<void>;
  enqueue(task: Task): Promise<string>;
  dequeue(): Promise<Task | null>;
  acknowledge(taskId: string): Promise<void>;
  deadLetter(taskId: string, error: Error): Promise<void>;
  getStats(): Promise<QueueStats>;
  cleanup(): Promise<void>;
} 