import { feathers } from '@feathersjs/feathers';
import express, { json, urlencoded, errorHandler } from '@feathersjs/express';
import { Application } from '@feathersjs/feathers';
import { QueueService } from '../../src/feathers/queue.service';
import { FeathersQueueConfig } from '../../src/core/interfaces/queue.interface';
import { mockServiceAccount } from '../config/gcp-credentials';

interface TestAppOptions {
  useEmulator?: boolean;
  emulatorConfig?: {
    host: string;
    port: string;
    projectId: string;
    location: string;
  };
}

/**
 * Creates a test Feathers application with the queue service configured
 */
export const createTestApp = async (options: TestAppOptions = {}): Promise<Application> => {
  const app = express(feathers());

  // Set up emulator environment if needed
  if (options.useEmulator) {
    process.env.CLOUD_TASKS_EMULATOR = 'true';
    process.env.GOOGLE_CLOUD_PROJECT = options.emulatorConfig?.projectId || 'test-project';
    
    if (options.emulatorConfig?.host && options.emulatorConfig?.port) {
      process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${options.emulatorConfig.host}:${options.emulatorConfig.port}`;
    }
  }

  // Configure the app with FeathersQueueConfig format
  const queueConfig: FeathersQueueConfig = {
    app,
    routing: false,
    provider: 'gcp',
    defaults: {
      provider: 'gcp',
      projectId: options.emulatorConfig?.projectId || 'test-project',
      location: options.emulatorConfig?.location || 'test-location',
      queueName: 'test-queue',
      name: 'test-queue',
      serviceAccountEmail: mockServiceAccount.client_email,
      taskHandlerUrl: 'http://localhost:3030/tasks',
      emulator: options.useEmulator ? {
        host: options.emulatorConfig?.host || 'localhost',
        port: options.emulatorConfig?.port || '8123'
      } : undefined,
      // Add required default values
      maxRetries: 3,
      retryDelay: 1000
    },
    queues: {
      'test-queue': {
        provider: 'gcp',
        projectId: options.emulatorConfig?.projectId || 'test-project',
        location: options.emulatorConfig?.location || 'test-location',
        queueName: 'test-queue',
        name: 'test-queue',
        serviceAccountEmail: mockServiceAccount.client_email,
        taskHandlerUrl: 'http://localhost:3030/tasks',
        emulator: options.useEmulator ? {
          host: options.emulatorConfig?.host || 'localhost',
          port: options.emulatorConfig?.port || '8123'
        } : undefined
      }
    }
  };

  app.set('feathers-queue', queueConfig);

  // Configure Express middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(errorHandler());

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