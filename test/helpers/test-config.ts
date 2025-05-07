import { Application } from '@feathersjs/feathers';

export interface TestConfig {
  projectId: string;
  location: string;
  queueName: string;
  taskHandlerUrl: string;
  allowedDomains: string[];
  emulator?: {
    host: string;
    port: string;
  };
}

export interface TestAppOptions {
  useEmulator?: boolean;
  config?: Partial<TestConfig>;
  app?: Application;
}

// Default test configuration
const defaultConfig: TestConfig = {
  projectId: 'test-project',
  location: 'test-location',
  queueName: 'test-queue',
  taskHandlerUrl: 'http://localhost:3030/tasks',
  allowedDomains: ['localhost', 'cloud-tasks-emulator'],
  emulator: {
    host: 'localhost',
    port: '8123'
  }
};

// Get configuration with CLI overrides
export function getTestConfig(options: TestAppOptions = {}): TestConfig {
  // Start with default config
  const config = { ...defaultConfig };

  // Apply CLI overrides if they exist
  if (process.env.TEST_PROJECT_ID) config.projectId = process.env.TEST_PROJECT_ID;
  if (process.env.TEST_LOCATION) config.location = process.env.TEST_LOCATION;
  if (process.env.TEST_QUEUE_NAME) config.queueName = process.env.TEST_QUEUE_NAME;
  if (process.env.TEST_TASK_HANDLER_URL) config.taskHandlerUrl = process.env.TEST_TASK_HANDLER_URL;
  
  // Handle emulator configuration
  if (options.useEmulator) {
    config.emulator = {
      host: process.env.TEST_EMULATOR_HOST || 'localhost',
      port: process.env.TEST_EMULATOR_PORT || '8123'
    };
  } else {
    delete config.emulator;
  }

  // Apply any additional options
  return {
    ...config,
    ...options.config
  };
}

// Set up test environment variables
export function setupTestEnvironment(options: TestAppOptions = {}): void {
  const config = getTestConfig(options);
  
  // Set base environment variables
  process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
  process.env.TASK_HANDLER_URL = config.taskHandlerUrl;
  
  // Set emulator environment variables if using emulator
  if (options.useEmulator && config.emulator) {
    process.env.CLOUD_TASKS_EMULATOR = 'true';
    process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${config.emulator.host}:${config.emulator.port}`;
    process.env.GOOGLE_APPLICATION_CREDENTIALS = 'fake-credentials.json';
  }
} 