import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp } from '../helpers/test-app';
import { Application, Service } from '@feathersjs/feathers';
import { QueueService } from '../../src/feathers/queue.service';
import { emulatorConfig } from '../config/gcp-emulator';
import { Task } from '../../src/core/types/task.types';

/**
 * Integration Tests
 * 
 * These tests verify the integration between the Feathers service layer
 * and the GCP Queue implementation using emulators.
 */
describe('GCP Queue Integration Tests', () => {
  let app: Application;
  let queueService: Service;

  beforeAll(async () => {
    // Create a test app with the GCP queue service
    app = await createTestApp({
      useEmulator: true,
      emulatorConfig: {
        ...emulatorConfig,
        host: process.env.DOCKER_ENV ? 'cloud-tasks-emulator' : 'localhost',
        port: '8123'
      }
    });
    
    // Get the queue service
    queueService = app.service('queue');
    
    // Clean up any existing tasks
    try {
      await queueService.remove(null);
    } catch (error) {
      console.log('Error cleaning up tasks:', error);
    }
  }, 30000);

  describe('Service Operations', () => {
    it('should have proper Feathers service methods', async () => {
      expect(queueService.find).toBeDefined();
      expect(queueService.get).toBeDefined();
      expect(queueService.create).toBeDefined();
      expect(queueService.patch).toBeDefined();
      expect(queueService.remove).toBeDefined();
    });

    it('should create a task through the service layer', async () => {
      const task: Task = {
        id: 'test-task-1',
        type: 'test-task',
        payload: { test: 'data' }
      };

      const result = await queueService.create(task);
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('test-task');
    });

    it('should create multiple tasks in one call', async () => {
      const tasks: Task[] = [
        {
          id: 'batch-task-1',
          type: 'test-task',
          payload: { test: 'data-1' }
        },
        {
          id: 'batch-task-2',
          type: 'test-task',
          payload: { test: 'data-2' }
        }
      ];

      const results = await queueService.create(tasks) as any[];
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].id).toBeTruthy();
      expect(results[1].id).toBeTruthy();
    });

    it('should handle scheduled tasks', async () => {
      const task: Task = {
        id: 'scheduled-task',
        type: 'test-task',
        payload: { test: 'scheduled' },
        options: {
          scheduledFor: Date.now() + 3600000 // 1 hour from now
        }
      };

      const result = await queueService.create(task);
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should find queue statistics', async () => {
      const stats = await queueService.find();
      expect(stats).toBeDefined();
      // Stats structure depends on the implementation and emulator capabilities
    });

    it('should clean up tasks', async () => {
      // First create a task
      const task: Task = {
        id: 'cleanup-task',
        type: 'test-task',
        payload: { test: 'cleanup' }
      };

      await queueService.create(task);
      
      // Clean up
      const result = await queueService.remove(null) as any;
      expect(result).toBeDefined();
      expect(result.id).toBe('queue-cleanup');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task data', async () => {
      const invalidTask = {
        id: 'test-task',
        type: 'test-task',
        // Missing payload property
      } as Task;

      await expect(queueService.create(invalidTask)).rejects.toThrow();
    });

    it('should reject unsupported methods', async () => {
      await expect(queueService.get('any-id')).rejects.toThrow('Method not allowed');
      await expect(queueService.patch('any-id', { type: 'test' } as Task)).rejects.toThrow('Method not allowed');
      await expect(queueService.update('any-id', { type: 'test', payload: {} } as Task)).rejects.toThrow('Method not allowed');
    });
  });
}); 