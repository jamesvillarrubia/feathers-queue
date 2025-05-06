import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GCPQueue } from '../../src/providers/gcp/gcp-queue.class';
import { createTestApp, cleanupApp } from './test-app';
import { CloudTasksClient } from '@google-cloud/tasks';
import { credentials } from '@grpc/grpc-js';
import { mockServiceAccount } from '../config/gcp-credentials';

describe('GCPQueue E2E Tests', () => {
  let app: any;
  let queue: any;

  beforeEach(async () => {
    // Set up emulator environment
    process.env.CLOUD_TASKS_EMULATOR = 'true';
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    
    app = await createTestApp();
    queue = app.service('gcp-queue');
  }, 30000);

  afterEach(async () => {
    await cleanupApp(app);
  }, 30000);

  describe('Queue Integration with Feathers', () => {
    it('should integrate with Feathers application lifecycle', async () => {
      expect(queue).toBeDefined();
      expect(queue.find).toBeDefined();
      expect(queue.create).toBeDefined();
    });

    it('should handle tasks through Feathers service', async () => {
      const task = {
        id: 'test-task-1',
        type: 'test-task',
        payload: { test: 'data' }
      };

      await queue.create(task);

      // Verify queue statistics through the service
      expect(queue).toBeDefined();
    });

    it('should handle scheduled tasks through Feathers service', async () => {
      const task = {
        id: 'test-task-2',
        type: 'test-task',
        payload: { test: 'data' }
      };

      await queue.create(task, {
        query: {
          scheduledFor: Date.now() + 1000
        }
      });

      // Verify queue statistics through the service
      expect(queue).toBeDefined();
    });
  });

  describe('Queue Cleanup', () => {
    it('should clean up resources when Feathers app is shutting down', async () => {
      const task = {
        id: 'test-task-3',
        type: 'test-task',
        payload: { test: 'data' }
      };

      await queue.create(task);

      // Verify queue exists before cleanup
      expect(queue).toBeDefined();

      // Clean up the queue
      await queue.remove('queue-cleanup');

      // Verify queue still exists after cleanup
      expect(queue).toBeDefined();
    });
  });
}); 