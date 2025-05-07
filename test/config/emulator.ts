import { getConfig } from './base';
import { mockServiceAccount } from './credentials';

export interface EmulatorConfig {
  host: string;
  port: string;
  projectId: string;
  location: string;
  queueName: string;
}

export function getEmulatorConfig(): EmulatorConfig {
  const config = getConfig({ useEmulator: true });
  return {
    host: config.emulator?.host || 'localhost',
    port: config.emulator?.port || '8123',
    projectId: config.projectId,
    location: config.location,
    queueName: config.queueName
  };
}

export function setupEmulatorEnvironment(): void {
  const config = getEmulatorConfig();
  
  // Set environment variables for emulator
  process.env.CLOUD_TASKS_EMULATOR = 'true';
  process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
  process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = `${config.host}:${config.port}`;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = 'fake-credentials.json';
}

// Export mock credentials for testing
export { mockServiceAccount }; 