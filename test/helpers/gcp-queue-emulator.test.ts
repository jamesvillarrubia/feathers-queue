import { describe, it, expect, beforeAll } from 'vitest';
import { CloudTasksClient } from '@google-cloud/tasks';
import { credentials } from '@grpc/grpc-js';

describe('GCP Queue Emulator Tests', () => {
  const client = new CloudTasksClient({
    port: 8123,
    servicePath: 'localhost',
    sslCreds: credentials.createInsecure(),
  });

  // This is the predefined queue that the emulator starts with
  const queuePath = 'projects/dev/locations/here/queues/anotherq';
  
  // Generate a unique queue name for testing queue creation/deletion
  const uniqueQueueName = `test-queue-${Date.now()}`;
  const testQueuePath = `projects/dev/locations/here/queues/${uniqueQueueName}`;
  const parent = 'projects/dev/locations/here';

  // Ensure the predefined queue exists before running task tests
  beforeAll(async () => {
    // try {
    //   await client.getQueue({ name: queuePath });
    // } catch (error: any) {
    //   if (error.code === 5) { // NOT_FOUND
    //     await client.createQueue({
    //       parent,
    //       queue: { name: queuePath }
    //     });
    //   }
    // }
  });

  describe('Queue Management', () => {
    it('should create and delete a queue', async () => {
      // Create a new queue with a unique name
      await client.createQueue({
        parent,
        queue: { name: testQueuePath }
      });

      // Verify queue exists
      const [queue] = await client.getQueue({ name: testQueuePath });
      expect(queue).toBeDefined();
      expect(queue.name).toBe(testQueuePath);

      // Delete the queue
      await client.deleteQueue({ name: testQueuePath });

      // Verify queue is deleted
      try {
        await client.getQueue({ name: testQueuePath });
        throw new Error('Queue should not exist');
      } catch (error: any) {
        expect(error.code).toBe(5); // NOT_FOUND
      }
    });
  });

  describe('Task Operations', () => {
    it('should create and retrieve a task', async () => {
      // Create a GET task
      const [task] = await client.createTask({
        parent: queuePath,
        task: { 
          httpRequest: { 
            httpMethod: 'GET', 
            url: 'https://httpbin.org/get' 
          } 
        },
      });

      expect(task.name).toBeDefined();
      expect(task.name).toContain(queuePath);

      // Verify we can retrieve the task
      const [retrievedTask] = await client.getTask({ name: task.name });
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.name).toBe(task.name);
    });

    it('should create a POST task with payload', async () => {
      const payload = { foo: "bar" };
      const [task] = await client.createTask({
        parent: queuePath,
        task: {
          httpRequest: {
            url: "https://httpbin.org/post",
            httpMethod: "POST",
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            headers: {"Content-Type": "application/json"},
          },
        },
      });

      expect(task.name).toBeDefined();
      expect(task.name).toContain(queuePath);
    });

    it('should create a scheduled task', async () => {
      const scheduledTime = Math.floor(Date.now() / 1000) + 60; // 1 minute in the future
      const [task] = await client.createTask({
        parent: queuePath,
        task: {
          httpRequest: {
            httpMethod: 'GET',
            url: 'https://httpbin.org/get'
          },
          scheduleTime: {
            seconds: scheduledTime
          }
        }
      });

      expect(task.name).toBeDefined();
      expect(task.name).toContain(queuePath);
      
      // Verify task exists
      const [retrievedTask] = await client.getTask({ name: task.name });
      expect(retrievedTask).toBeDefined();
      // Convert scheduleTime.seconds to number for comparison
      expect(Number(retrievedTask.scheduleTime?.seconds)).toBe(scheduledTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle task creation with invalid URL', async () => {
      const [task] = await client.createTask({
        parent: queuePath,
        task: {
          httpRequest: {
            httpMethod: 'GET',
            url: 'https://httpbin.org/status/500' // This will return a 500 error when executed
          }
        }
      });

      expect(task.name).toBeDefined();
      expect(task.name).toContain(queuePath);
    });
  });
}); 