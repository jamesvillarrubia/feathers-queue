import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GCPQueue, GCPQueueOptions } from '../../src/providers/gcp/gcp-queue.class';
import { Task, TaskOptions } from '../../src/core/types/task.types';
import { Application } from '@feathersjs/feathers';

// Mock the CloudTasksClient
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

// Mock credentials
vi.mock('@grpc/grpc-js', () => {
  return {
    credentials: {
      createInsecure: vi.fn().mockReturnValue({}),
    },
  };
});

describe('GCPQueue Domain Validation', () => {
  let queue: GCPQueue;
  const mockApp = {} as Application;
  
  beforeEach(() => {
    // Reset mock calls
    vi.clearAllMocks();
    
    // Create a queue with allowed domains
    const options: GCPQueueOptions = {
      app: mockApp,
      provider: 'gcp',
      projectId: 'test-project',
      location: 'test-location',
      allowedDomains: ['localhost', 'example.com', 'ngrok.io'],
      taskHandlerUrl: 'http://localhost:3030/tasks',
      queueName: 'default',
    };
    
    queue = new GCPQueue(options);
    
    // Mock the initialization to avoid actual calls
    vi.spyOn(queue, 'initialize').mockResolvedValue();
  });

  it('should allow tasks with default handler URL', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
    };

    const result = await queue.enqueue(task);
    expect(result).toBe('test-task');
  });

  it('should allow tasks with allowed domain in targetUrl', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
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
      payload: { test: 'data' }
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
      payload: { test: 'data' }
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
      payload: { test: 'data' }
    };

    const options: TaskOptions = {
      targetUrl: 'invalid-url',
    };

    await expect(queue.enqueue(task, options)).rejects.toThrow('Invalid URL');
  });
}); 