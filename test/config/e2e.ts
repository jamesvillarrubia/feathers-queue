import { getConfig } from './base';

export interface E2EConfig {
  projectId: string;
  location: string;
  queueName: string;
  taskHandlerUrl: string;
  allowedDomains: string[];
  ngrok?: {
    port: number;
    subdomain?: string;
  };
}

export function getE2EConfig(): E2EConfig {
  const config = getConfig();
  
  // If running in Docker, use the container URL
  if (process.env.DOCKER_ENV) {
    return {
      ...config,
      taskHandlerUrl: 'http://example-app:3030/tasks',
      allowedDomains: ['example-app', 'cloud-tasks-emulator']
    };
  }
  
  // If running locally with ngrok, use the ngrok URL
  if (process.env.NGROK_URL) {
    return {
      ...config,
      taskHandlerUrl: `${process.env.NGROK_URL}/tasks`,
      allowedDomains: ['localhost', 'cloud-tasks-emulator', process.env.NGROK_URL.replace('https://', '')],
      ngrok: {
        port: 3030,
        subdomain: process.env.NGROK_SUBDOMAIN
      }
    };
  }
  
  // Default to local configuration
  return config;
}

export function setupE2EEnvironment(): void {
  const config = getE2EConfig();
  
  // Set environment variables for E2E testing
  process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
  process.env.TASK_HANDLER_URL = config.taskHandlerUrl;
  
  // If using ngrok, set additional environment variables
  if (config.ngrok) {
    process.env.NGROK_PORT = config.ngrok.port.toString();
    if (config.ngrok.subdomain) {
      process.env.NGROK_SUBDOMAIN = config.ngrok.subdomain;
    }
  }
} 