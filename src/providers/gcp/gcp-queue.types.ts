/**
 * @feathers-cloud/task-queue
 * 
 * GCP-specific types for the queue implementation.
 * This file contains types that are specific to Google Cloud Tasks.
 */

import { QueueStats, QueueConfig } from '../../core/queue.types';

export interface GCPQueueStats extends QueueStats {
  // Additional GCP-specific stats
  unackedTasksCount?: number;
  oldestTask?: string;
  rateLimits?: {
    maxDispatchesPerSecond: number;
    maxBurstSize: number;
    maxConcurrentDispatches: number;
  };
  retryConfig?: {
    maxAttempts: number;
    maxRetryDuration: number;
    minBackoff: number;
    maxBackoff: number;
    maxDoublings: number;
  };
}

export interface GCPQueueOptions extends QueueConfig {
  projectId: string;
  location: string;
  serviceAccountEmail?: string;
  emulator?: {
    host: string;
    port: string;
  };
  queueName?: string;
  taskHandlerUrl?: string;
  handlerRootPath?: string;
  maxRetries?: number;
  priority?: number;
  scheduledFor?: number;
  exactlyOnce?: boolean;
  allowedDomains?: string[];
  enhancedStats?: boolean; // New option to enable enhanced stats
} 