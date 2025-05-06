import { SingleQueueConfig } from '../../src/core/interfaces/queue.interface';
import { Application } from '@feathersjs/feathers';
import { credentials } from '@grpc/grpc-js';
import { mockServiceAccount } from './gcp-credentials';

// Create a mock Feathers application
const mockApp = {
  get: () => ({}),
  set: () => ({}),
  hooks: { error: [] },
  service: () => ({})
} as unknown as Application;

/**
 * Emulator configuration for testing
 */
export const emulatorConfig: SingleQueueConfig = {
  app: mockApp,
  provider: 'gcp',
  projectId: 'test-project',
  location: 'test-location',
  serviceAccountEmail: mockServiceAccount.client_email,
  name: 'test-queue',
  queueName: 'test-queue',
  
  // Task handler settings
  taskHandlerUrl: 'http://localhost:3030/tasks',
  handlerRootPath: '/tasks',
  
  // Queue settings
  maxRetries: 3,
  retryDelay: 1000,
  allowedDomains: ['localhost', 'example.com', 'ngrok.io'],
  
  // Emulator specific settings
  emulator: {
    host: 'localhost',
    port: '8123'
  }
};

/**
 * Set up the environment for the emulator
 */
export function setupEmulatorEnvironment(): void {
  // Set environment variables for emulator
  process.env.CLOUD_TASKS_EMULATOR = 'true';
  process.env.GOOGLE_CLOUD_PROJECT = emulatorConfig.projectId;
  process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${emulatorConfig.emulator?.host}:${emulatorConfig.emulator?.port}`;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = 'fake-credentials.json';
}

// Initialize environment variables
setupEmulatorEnvironment(); 