import { QueueOptions } from '../src/core/interfaces/queue.interface';
import { Task, TaskOptions } from '../src/core/types/task.types';
import { GCPQueue } from '../src/providers/gcp/gcp-queue.class';
import { QueueInterface } from '../src/core/interfaces/queue.interface';

export class QueueManager {
  private queue: QueueInterface;

  constructor(options: QueueOptions) {
    switch (options.provider) {
      case 'gcp':
        this.queue = new GCPQueue(options);
        break;
      case 'aws':
        throw new Error('AWS provider not implemented yet');
      case 'azure':
        throw new Error('Azure provider not implemented yet');
      default:
        throw new Error(`Unsupported queue provider: ${options.provider}`);
    }
  }

  async enqueue(task: Task, options?: TaskOptions): Promise<string> {
    return this.queue.enqueue(task, options);
  }

  async dequeue(): Promise<Task | null> {
    return this.queue.dequeue();
  }

  async acknowledge(taskId: string): Promise<void> {
    return this.queue.acknowledge(taskId);
  }

  async deadLetter(taskId: string, error: Error): Promise<void> {
    return this.queue.deadLetter(taskId, error);
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    return this.queue.getStats();
  }

  async getTask(taskId: string): Promise<Task | null> {
    // This is a placeholder - actual implementation would depend on the provider
    return null;
  }

  async cleanup(): Promise<void> {
    return this.queue.cleanup();
  }
} 