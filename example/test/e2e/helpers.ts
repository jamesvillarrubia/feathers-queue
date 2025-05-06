/**
 * E2E Test Helpers
 * 
 * Helper functions for setting up and tearing down the GCP queue for testing.
 */

import { CloudTasksClient } from '@google-cloud/tasks';
import { config } from '../../../test/live-e2e/config';
import { v4 as uuidv4 } from 'uuid';
import debug from 'debug';

const debugTest = debug('feathers:queue:test');

// Create a unique queue name for testing to avoid conflicts
const TEST_QUEUE_NAME = `feathers-queue-test-${uuidv4().substring(0, 8)}`;

// Initialize the Cloud Tasks client
const client = new CloudTasksClient({
  keyFilename: config.gcp.keyFilename,
});

/**
 * Set up a test queue in Google Cloud Tasks
 */
export async function setupTestQueue() {
  try {
    // Create the queue path
    const parent = client.queuePath(
      config.gcp.projectId,
      config.gcp.location,
      TEST_QUEUE_NAME
    );
    
    // Create the queue with test configuration
    const [queue] = await client.createQueue({
      parent: client.locationPath(config.gcp.projectId, config.gcp.location),
      queue: {
        name: parent,
        rateLimits: {
          maxDispatchesPerSecond: 500,
          maxBurstSize: 100,
          maxConcurrentDispatches: 100,
        },
        retryConfig: {
          maxAttempts: 5,
          maxRetryDuration: { seconds: 3600 },
          minBackoff: { seconds: 0.1 },
          maxBackoff: { seconds: 3600 },
          maxDoublings: 16,
        },
      },
    });
    
    debugTest(`Created test queue: ${queue.name}`);
    
    // Return the queue name for use in tests
    return TEST_QUEUE_NAME;
  } catch (error) {
    debugTest('Error setting up test queue: %s', error);
    throw error;
  }
}

/**
 * Clean up the test queue
 */
export async function cleanupTestQueue() {
  try {
    // Get the queue path
    const name = client.queuePath(
      config.gcp.projectId,
      config.gcp.location,
      TEST_QUEUE_NAME
    );
    
    // Delete the queue
    await client.deleteQueue({ name });
    debugTest(`Deleted test queue: ${name}`);
  } catch (error) {
    debugTest('Error cleaning up test queue: %s', error);
    // Don't throw here, as this is cleanup
  }
}

/**
 * Create a test task in the queue
 */
export async function createTestTask(taskData: any = { test: 'data' }) {
  try {
    // Get the queue path
    const parent = client.queuePath(
      config.gcp.projectId,
      config.gcp.location,
      TEST_QUEUE_NAME
    );
    
    // Create the task
    const [task] = await client.createTask({
      parent,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: config.api.taskHandlerUrl,
          headers: {
            'Content-Type': 'application/json',
          },
          body: Buffer.from(JSON.stringify(taskData)).toString('base64'),
        },
      },
    });
    
    return task;
  } catch (error) {
    debugTest('Error creating test task: %s', error);
    throw error;
  }
}

/**
 * Get the current test queue name
 */
export function getTestQueueName() {
  return TEST_QUEUE_NAME;
} 