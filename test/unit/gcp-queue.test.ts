import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GCPQueue, GCPQueueOptions } from '../../src/providers/gcp/gcp-queue.class';
import { Application } from '@feathersjs/feathers';
import { Task, TaskOptions } from '../../src/core/types/task.types';

// Mock the CloudTasksClient completely
const mockClient = {
  queuePath: vi.fn().mockReturnValue('projects/test-project/locations/test-location/queues/test-queue'),
  locationPath: vi.fn().mockReturnValue('projects/test-project/locations/test-location'),
  getQueue: vi.fn().mockResolvedValue([{ name: 'test-queue' }]),
  createQueue: vi.fn().mockResolvedValue([{ name: 'test-queue' }]),
  createTask: vi.fn().mockResolvedValue([{ name: 'test-task' }]),
};

vi.mock('@google-cloud/tasks', () => ({
  CloudTasksClient: vi.fn().mockImplementation(() => mockClient),
}));

// Mock the credentials
vi.mock('@grpc/grpc-js', () => {
  return {
    credentials: {
      createInsecure: vi.fn().mockReturnValue({}),
    },
  };
});

describe('GCPQueue Unit Tests', () => {
  let queue: GCPQueue;
  const mockApp = {} as Application;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    const mockOptions: GCPQueueOptions = {
      app: mockApp,
      provider: 'gcp',
      projectId: 'test-project',
      location: 'test-location',
      taskHandlerUrl: 'http://localhost:3030/tasks',
      queueName: 'test-queue',
      allowedDomains: ['localhost', 'example.com', 'ngrok.io']
    };

    queue = new GCPQueue(mockOptions);
    
    // Mock initialization to avoid actual calls
    vi.spyOn(queue, 'initialize').mockResolvedValue();
  });

  describe('validateConfig', () => {
    it('should validate required GCP configuration', async () => {
      const invalidQueue = new GCPQueue({
        app: mockApp,
        provider: 'gcp',
        projectId: undefined as any,
        location: 'test-location',
        queueName: 'test-queue',
        taskHandlerUrl: 'http://localhost:3030/tasks'
      });
      
      await expect(invalidQueue['validateConfig']()).rejects.toThrow('GCP project ID is required');
    });

    it('should validate required location', async () => {
      const invalidQueue = new GCPQueue({
        app: mockApp,
        provider: 'gcp',
        projectId: 'test-project',
        location: undefined as any,
        queueName: 'test-queue',
        taskHandlerUrl: 'http://localhost:3030/tasks'
      });
      
      await expect(invalidQueue['validateConfig']()).rejects.toThrow('GCP location is required');
    });
  });

  describe('setupQueue', () => {
    it('should handle queue creation failure', async () => {
      mockClient.getQueue.mockRejectedValueOnce(new Error('Queue not found'));
      mockClient.createQueue.mockRejectedValueOnce(new Error('Creation failed'));
      
      // Set up the property access to avoid the error coming from validateConfig
      Object.defineProperty(queue, 'taskHandlerUrl', { 
        get: () => 'http://localhost:3030/tasks'
      });
      
      await expect(queue['setupQueue']()).rejects.toThrow('Creation failed');
    });
  });

  describe('enqueue', () => {
    it('should handle task creation failure', async () => {
      mockClient.createTask.mockRejectedValueOnce(new Error('Task creation failed'));
      
      const task = {
        id: 'test-id',
        type: 'test-task',
        payload: { test: 'data' },
      };

      await expect(queue.enqueue(task)).rejects.toThrow('Task creation failed');
    });
  });

  describe('getStats', () => {
    it('should handle statistics retrieval failure', async () => {
      mockClient.getQueue.mockRejectedValueOnce(new Error('Stats retrieval failed'));
      
      // getStats should not throw an error but return empty stats
      const stats = await queue.getStats();
      expect(stats).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      });
    });
  });

  describe('domain validation', () => {
    it('should allow tasks with default handler URL', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const result = await queue.enqueue(task);
      expect(result).toBe('test-task');
    });

    it('should allow tasks with allowed domain in targetUrl', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'http://localhost:3030',
      };

      const result = await queue.enqueue(task, options);
      expect(result).toBe('test-task');
    });

    it('should allow tasks with allowed domain subdomain in targetUrl', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'https://subdomain.ngrok.io',
      };

      const result = await queue.enqueue(task, options);
      expect(result).toBe('test-task');
    });

    it('should throw an error for tasks with disallowed domain in targetUrl', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'https://malicious-site.com',
      };

      await expect(queue.enqueue(task, options)).rejects.toThrow(
        'Domain "malicious-site.com" is not in the allowed list'
      );
    });

    it('should throw an error for tasks with invalid URL in targetUrl', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'invalid-url',
      };

      await expect(queue.enqueue(task, options)).rejects.toThrow('Invalid URL');
    });
  });

  describe('root path handling', () => {
    it('should use the default root path', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'http://localhost:3030',
      };

      await queue.enqueue(task, options);
      expect(mockClient.createTask).toHaveBeenCalled();
    });

    it('should use a custom root path', async () => {
      const task: Task = {
        id: 'test-id',
        type: 'test',
        payload: { test: 'data' },
      };

      const options: TaskOptions = {
        targetUrl: 'http://localhost:3030',
        rootPath: '/api/tasks',
      };

      await queue.enqueue(task, options);
      expect(mockClient.createTask).toHaveBeenCalled();
    });
  });
}); 