import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseQueue } from '../../src/core/base-queue.class';
import { QueueConfig } from '../../src/core/queue.types';
import { Task, TaskOptions } from '../../src/core/task.types';
import { Application } from '@feathersjs/feathers';

// Create a concrete implementation of BaseQueue for testing
class TestQueue extends BaseQueue {
  constructor(config: QueueConfig) {
    super(config);
  }

  protected async validateConfig(): Promise<void> {
    // No validation needed for test queue
  }

  protected async setupQueue(): Promise<void> {
    // No setup needed for test queue
  }

  async enqueue(task: Task): Promise<string> {
    throw new Error('Method not implemented');
  }

  async dequeue(): Promise<Task | null> {
    throw new Error('Method not implemented');
  }

  async acknowledge(taskId: string): Promise<void> {
    throw new Error('Method not implemented');
  }

  async deadLetter(taskId: string, error: Error): Promise<void> {
    throw new Error('Method not implemented');
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    throw new Error('Method not implemented');
  }

  async cleanup(): Promise<void> {
    throw new Error('Method not implemented');
  }
}

describe('BaseQueue', () => {
  let queue: TestQueue;
  let mockApp: Application;
  let config: QueueConfig;

  beforeEach(() => {
    mockApp = {
      get: vi.fn(),
      set: vi.fn(),
      service: vi.fn(),
    } as unknown as Application;

    config = {
      app: mockApp,
      provider: 'gcp',
      name: 'test-queue',
      maxRetries: 3,
      retryDelay: 1000,
    };

    queue = new TestQueue(config);
  });

  it('should initialize with config', () => {
    expect(queue['config']).toEqual(config);
  });

  it('should throw error when enqueue is not implemented', async () => {
    const task: Task = {
      id: 'test-task',
      name: 'test-task',
      type: 'test',
      payload: { test: 'data' },
    };

    await expect(queue.enqueue(task)).rejects.toThrow('Method not implemented');
  });

  it('should throw error when dequeue is not implemented', async () => {
    await expect(queue.dequeue()).rejects.toThrow('Method not implemented');
  });

  it('should throw error when acknowledge is not implemented', async () => {
    await expect(queue.acknowledge('test-task')).rejects.toThrow('Method not implemented');
  });

  it('should throw error when deadLetter is not implemented', async () => {
    await expect(queue.deadLetter('test-task', new Error('test error'))).rejects.toThrow('Method not implemented');
  });

  it('should throw error when getStats is not implemented', async () => {
    await expect(queue.getStats()).rejects.toThrow('Method not implemented');
  });

  it('should throw error when cleanup is not implemented', async () => {
    await expect(queue.cleanup()).rejects.toThrow('Method not implemented');
  });
}); 