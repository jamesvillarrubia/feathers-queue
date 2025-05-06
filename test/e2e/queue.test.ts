import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeathersQueueConfig } from '../../src/core/interfaces/queue.interface';
import { createTestApp, cleanupApp } from './test-app';
import { createTestEndpoints } from './test-app';
import debug from 'debug';
import { QueueService } from '../../src/feathers/queue.service';

const debugTest = debug('feathers:queue:test');

describe('Queue E2E Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = await createTestApp();
    createTestEndpoints(app);
  }, 30000);

  afterEach(async () => {
    await cleanupApp(app);
  }, 30000);

  describe('GCP Queue', () => {
    it('should create a task', async () => {
      const gcpQueue = app.service('gcp-tasks');
      
      // Clean up any existing queue first
      try {
        await gcpQueue.remove(null);
      } catch (error) {
        debugTest('Error cleaning up queue:', error);
      }

      const task = {
        id: 'test-task',
        type: 'test-task',
        payload: { test: 'data' }
      };

      const result = await gcpQueue.create(task);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should create multiple tasks', async () => {
      const gcpQueue = app.service('gcp-tasks');
      
      // Create first task
      const task1 = {
        id: 'test-task-1',
        type: 'test-task',
        payload: { test: 'data-1' }
      };

      const result1 = await gcpQueue.create(task1);
      expect(result1).toBeDefined();
      expect(result1.id).toBeDefined();

      // Create second task
      const task2 = {
        id: 'test-task-2',
        type: 'test-task',
        payload: { test: 'data-2' }
      };

      const result2 = await gcpQueue.create(task2);
      expect(result2).toBeDefined();
      expect(result2.id).toBeDefined();
    });
  });
}); 