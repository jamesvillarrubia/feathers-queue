import { feathers } from '@feathersjs/feathers';
import express, { json, urlencoded, errorHandler } from '@feathersjs/express';
import { Application } from '@feathersjs/feathers';
import { vi } from 'vitest';
import { QueueService } from '../../src/feathers/queue.service';
import { FeathersQueueConfig } from '../../src/core/interfaces/queue.interface';
import { CloudTasksClient } from '@google-cloud/tasks';
import { credentials } from '@grpc/grpc-js';
import { mockServiceAccount } from '../config/gcp-credentials';

// Create helper for cleanup
export const cleanupApp = async (app: Application): Promise<void> => {
  try {
    // Check if app and service exist
    if (!app || !app.service) {
      console.log('App or service not available for cleanup');
      return;
    }
    
    // Try to get the service safely
    try {
      const queueService = app.service('gcp-queue');
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

export const createTestApp = async (): Promise<Application> => {
  const app = express(feathers());

  // Set up emulator environment
  process.env.CLOUD_TASKS_EMULATOR = 'true';
  process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
  
  // Use the Docker container's hostname if running in Docker, otherwise use localhost
  const emulatorHost = process.env.DOCKER_ENV ? 'cloud-tasks-emulator' : 'localhost';
  process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${emulatorHost}:8123`;

  // Configure the app with proper FeathersQueueConfig format
  const queueConfig: FeathersQueueConfig = {
    app,
    routing: false,
    provider: 'gcp',
    defaults: {
      provider: 'gcp',
      projectId: 'test-project',
      location: 'test-location',
      queueName: 'test-queue',
      name: 'test-queue',
      serviceAccountEmail: mockServiceAccount.client_email,
      taskHandlerUrl: 'http://localhost:3030/tasks',
      emulator: {
        host: emulatorHost,
        port: '8123'
      },
      // Add required default values
      maxRetries: 3,
      retryDelay: 1000
    },
    queues: {
      'test-queue': {
        provider: 'gcp',
        projectId: 'test-project',
        location: 'test-location',
        queueName: 'test-queue',
        name: 'test-queue',
        serviceAccountEmail: mockServiceAccount.client_email,
        taskHandlerUrl: 'http://localhost:3030/tasks',
        emulator: {
          host: emulatorHost,
          port: '8123'
        }
      }
    }
  };

  app.set('feathers-queue', queueConfig);

  // Configure Express middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(errorHandler());

  // Configure services
  app.use('gcp-queue', new QueueService({
    app,
    config: queueConfig
  }));

  // Initialize the app
  await app.setup();

  return app;
};

// Test endpoints for each provider
export const createTestEndpoints = (app: Application): void => {
  // GCP Queue endpoint
  app.use('gcp-tasks', {
    async create(data: any) {
      const queue = app.service('gcp-queue');
      return queue.create(data);
    },
    async find() {
      const queue = app.service('gcp-queue');
      return queue.find();
    }
  });
}; 