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

describe('GCPQueue Root Path', () => {
  let queue: GCPQueue;
  const mockApp = {} as Application;
  
  beforeEach(() => {
    // Reset mock calls
    vi.clearAllMocks();
    
    // Create a queue with root path
    const options: GCPQueueOptions = {
      app: mockApp,
      provider: 'gcp',
      projectId: 'test-project',
      location: 'test-location',
      taskHandlerUrl: 'http://localhost:3030',
      handlerRootPath: '/tasks',
      queueName: 'default',
      allowedDomains: ['localhost']
    };
    
    queue = new GCPQueue(options);
    
    // Mock the initialization to avoid actual calls
    vi.spyOn(queue, 'initialize').mockResolvedValue();

    // Spy on the createTask method to check URL formation
    vi.spyOn(mockClient, 'createTask').mockImplementation((request) => {
      return Promise.resolve([
        { 
          name: 'test-task',
          httpRequest: request.task.httpRequest
        }
      ]);
    });
  });

  it('should use the default root path from config', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
    };

    await queue.enqueue(task);
    
    expect(mockClient.createTask).toHaveBeenCalled();
    // The URL should be formed with the handler root path
    const callArgs = mockClient.createTask.mock.calls[0][0];
    expect(callArgs.task.httpRequest.url).toBe('http://localhost:3030');
  });

  it('should use a custom root path from options', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
    };

    const options: TaskOptions = {
      rootPath: '/custom-path',
    };

    await queue.enqueue(task, options);
    
    expect(mockClient.createTask).toHaveBeenCalled();
    // The URL should be formed with the custom root path
    const callArgs = mockClient.createTask.mock.calls[0][0];
    expect(callArgs.task.httpRequest.url).toBe('http://localhost:3030');
  });

  it('should handle URLs that already end with a slash', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
    };

    const options: TaskOptions = {
      targetUrl: 'http://localhost:3030/',
    };

    await queue.enqueue(task, options);
    
    expect(mockClient.createTask).toHaveBeenCalled();
    // The URL should handle trailing slash correctly
    const callArgs = mockClient.createTask.mock.calls[0][0];
    expect(callArgs.task.httpRequest.url).toBe('http://localhost:3030/');
  });

  it('should handle root paths that don\'t start with a slash', async () => {
    const task: Task = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' }
    };

    const options: TaskOptions = {
      rootPath: 'no-slash',
    };

    await queue.enqueue(task, options);
    
    expect(mockClient.createTask).toHaveBeenCalled();
    // The URL should handle missing slash in root path
    const callArgs = mockClient.createTask.mock.calls[0][0];
    expect(callArgs.task.httpRequest.url).toBe('http://localhost:3030');
  });
}); 