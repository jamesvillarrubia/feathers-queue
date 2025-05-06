import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseQueue } from '../../src/core/queue/base-queue.class';
import { SingleQueueConfig } from '../../src/core/interfaces/queue.interface';
import { Task, TaskOptions } from '../../src/core/types/task.types';
import { Application } from '@feathersjs/feathers';

// Create a concrete implementation of BaseQueue for testing
class TestQueue extends BaseQueue {
  protected async validateConfig(): Promise<void> {
    // No validation needed for test queue
  }

  protected async setupQueue(): Promise<void> {
    // No setup needed for test queue
  }

  async enqueue(task: Task, options?: TaskOptions): Promise<string> {
    return 'test-task-id';
  }

  async dequeue(): Promise<Task | null> {
    return null;
  }

  async acknowledge(taskId: string): Promise<void> {}

  async deadLetter(taskId: string, error: Error): Promise<void> {}

  async getStats() {
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
  }

  async cleanup(): Promise<void> {}

  // Expose protected methods for testing
  public validateTaskPublic(task: Task): void {
    return this.validateTask(task);
  }

  public mergeTaskOptionsPublic(options?: TaskOptions): TaskOptions {
    return this.mergeTaskOptions(options);
  }
}

describe('BaseQueue', () => {
  let queue: TestQueue;
  const mockApp = {
    get: vi.fn()
  } as unknown as Application;
  
  const mockOptions: any= {
    app: mockApp,
    provider: 'local',
    config: {
      provider: 'test',
      projectId: 'test-project',
      location: 'test-location',
      name: 'test-queue'
    }
  };

  beforeEach(() => {
    queue = new TestQueue(mockOptions.config || {
      provider: 'test',
      projectId: 'test-project',
      location: 'test-location',
      name: 'test-queue'
    });
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const config: SingleQueueConfig = {
        provider: 'test',
        projectId: 'test-project',
        location: 'test-location',
        name: 'test-queue'
      };
      
      await queue.initialize(config);
      expect(queue['isInitialized']).toBe(true);
    });

    it('should prevent double initialization', async () => {
      const config: SingleQueueConfig = {
        provider: 'test',
        projectId: 'test-project',
        location: 'test-location',
        name: 'test-queue'
      };

      await queue.initialize(config);
      await expect(queue.initialize(config)).rejects.toThrow('Queue already initialized');
    });

    it('should merge config with defaults', async () => {
      const config: SingleQueueConfig = {
        provider: 'test',
        projectId: 'test-project',
        location: 'test-location',
        name: 'test-queue',
        maxRetries: 5
      };

      await queue.initialize(config);
      expect(queue['config'].maxRetries).toBe(5);
      expect(queue['config'].retryDelay).toBe(1000); // Default value
    });
  });

  describe('task validation', () => {
    it('should validate task with required fields', () => {
      const task: Task = {
        id: 'test-task',
        type: 'test-queue',
        payload: { test: 'data' }
      };
      
      expect(() => queue.validateTaskPublic(task)).not.toThrow();
    });

    it('should throw error for missing id', () => {
      const task: Task = {
        id: undefined,
        type: 'test-queue',
        payload: { test: 'data' }
      };
      
      expect(() => queue.validateTaskPublic(task)).toThrow('Task must have an id');
    });

    it('should throw error for missing type', () => {
      const task: Task = {
        id: 'test-task',
        type: '',
        payload: { test: 'data' }
      };
      
      expect(() => queue.validateTaskPublic(task)).toThrow('Task must have a type (queue name)');
    });

    it('should throw error for missing payload', () => {
      const task: Task = {
        id: 'test-task',
        type: 'test-queue',
        payload: undefined
      };
      
      expect(() => queue.validateTaskPublic(task)).toThrow('Task must have a payload');
    });
  });

  describe('task options', () => {
    it('should merge options with defaults', () => {
      const options: TaskOptions = {
        priority: 1
      };

      const merged = queue.mergeTaskOptionsPublic(options);
      expect(merged.maxRetries).toBe(3); // Default value
      expect(merged.retryDelay).toBe(1000); // Default value
      expect(merged.priority).toBe(1);
    });

    it('should override defaults with provided options', () => {
      const options: TaskOptions = {
        maxRetries: 5,
        retryDelay: 2000,
        priority: 1
      };

      const merged = queue.mergeTaskOptionsPublic(options);
      expect(merged.maxRetries).toBe(5);
      expect(merged.retryDelay).toBe(2000);
      expect(merged.priority).toBe(1);
    });
  });
}); 