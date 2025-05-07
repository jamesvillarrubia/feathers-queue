import { feathers } from '@feathersjs/feathers';
import express, { json, urlencoded, errorHandler } from '@feathersjs/express';
import { Application } from '@feathersjs/feathers';
import { QueueService } from '../../src/feathers/queue.service';
import { FeathersQueueConfig } from '../../src/core/interfaces/queue.interface';
import { mockServiceAccount } from '../config/gcp-credentials';
import { TestAppOptions, getTestConfig, setupTestEnvironment } from './test-config';

/**
 * Creates a test Feathers application with the queue service configured
 */
export const createTestApp = async (options: TestAppOptions = {}): Promise<Application> => {
  const app = express(feathers());
  const config = getTestConfig(options);

  // Set up test environment
  setupTestEnvironment(options);

  // Configure the app with FeathersQueueConfig format
  const queueConfig = {
    app,
    routing: false,
    provider: 'gcp',
    defaults: {
      provider: 'gcp',
      projectId: config.projectId,
      location: config.location,
      queueName: config.queueName,
      name: config.queueName,
      serviceAccountEmail: mockServiceAccount.client_email,
      taskHandlerUrl: config.taskHandlerUrl,
      emulator: config.emulator,
      maxRetries: 3,
      retryDelay: 1000
    },
    queues: {
      [config.queueName]: {
        provider: 'gcp',
        projectId: config.projectId,
        location: config.location,
        queueName: config.queueName,
        name: config.queueName,
        serviceAccountEmail: mockServiceAccount.client_email,
        taskHandlerUrl: config.taskHandlerUrl,
        emulator: config.emulator
      }
    }
  };

  app.set('feathers-queue', queueConfig);

  // Configure Express middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.errorHandler());

  // Configure services
  app.use('queue', new QueueService({
    app,
    config: queueConfig
  }));

  // Initialize the app
  await app.setup();

  return app;
};

/**
 * Cleans up test app resources
 */
export const cleanupTestApp = async (app: Application): Promise<void> => {
  try {
    // Only proceed if app exists
    if (!app) return;
    
    // Try to get the service safely
    try {
      const queueService = app.service('queue');
      if (queueService) {
        await queueService.remove(null);
      }
    } catch (error) {
      console.log('Service not available for cleanup');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}; 