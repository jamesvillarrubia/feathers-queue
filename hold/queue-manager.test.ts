import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueManager } from '../../src/core/queue/queue-manager.class';
import { QueueInterface, QueueOptions, QueueConfig } from '../src/core/interfaces/queue.interface';
import { Application } from '@feathersjs/feathers';

// Mock queue implementation
const mockQueue: QueueInterface = {
  initialize: vi.fn().mockResolvedValue(undefined),
  enqueue: vi.fn().mockResolvedValue('test-task-id'),
  dequeue: vi.fn().mockResolvedValue(null),
  acknowledge: vi.fn().mockResolvedValue(undefined),
  deadLetter: vi.fn().mockResolvedValue(undefined),
  getStats: vi.fn().mockResolvedValue({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  }),
  cleanup: vi.fn().mockResolvedValue(undefined)
};

describe('QueueManager', () => {
  let queueManager: QueueManager;
  const mockApp = {
    get: vi.fn()
  } as unknown as Application;

  beforeEach(() => {
    queueManager = new QueueManager(mockApp);
    vi.clearAllMocks();
  });

  describe('queue management', () => {
    it('should register and get a queue', () => {
      queueManager.registerQueue('test', mockQueue);
      const queue = queueManager.getQueue('test');
      expect(queue).toBe(mockQueue);
    });

    it('should throw error for duplicate queue registration', () => {
      queueManager.registerQueue('test', mockQueue);
      expect(() => queueManager.registerQueue('test', mockQueue)).toThrow('Queue with name "test" already exists');
    });

    it('should throw error for non-existent queue', () => {
      expect(() => queueManager.getQueue('non-existent')).toThrow('Queue with name "non-existent" not found');
    });

    it('should set and use default queue', () => {
      queueManager.registerQueue('test', mockQueue);
      queueManager.setDefaultQueue('test');
      const queue = queueManager.getQueue(); // No name provided, should use default
      expect(queue).toBe(mockQueue);
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      queueManager.registerQueue('test', mockQueue);
    });

    it('should enqueue task', async () => {
      const task = {
        id: 'test-id',
        type: 'test',
        data: { test: 'data' }
      };

      await queueManager.enqueue(task, { queue: 'test' });
      expect(mockQueue.enqueue).toHaveBeenCalledWith(task, { queue: 'test' });
    });

    it('should dequeue task', async () => {
      await queueManager.dequeue('test');
      expect(mockQueue.dequeue).toHaveBeenCalled();
    });

    it('should acknowledge task', async () => {
      await queueManager.acknowledge('test-id', 'test');
      expect(mockQueue.acknowledge).toHaveBeenCalledWith('test-id');
    });

    it('should dead letter task', async () => {
      const error = new Error('Test error');
      await queueManager.deadLetter('test-id', error, 'test');
      expect(mockQueue.deadLetter).toHaveBeenCalledWith('test-id', error);
    });
  });

  describe('statistics', () => {
    it('should get stats for all queues', async () => {
      queueManager.registerQueue('test1', mockQueue);
      queueManager.registerQueue('test2', mockQueue);

      const stats = await queueManager.getStats();
      expect(stats).toEqual({
        test1: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        },
        test2: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        }
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup all queues', async () => {
      queueManager.registerQueue('test1', mockQueue);
      queueManager.registerQueue('test2', mockQueue);

      await queueManager.cleanup();
      expect(mockQueue.cleanup).toHaveBeenCalledTimes(2);
    });
  });
}); 