/**
 * @feathers-cloud/task-queue
 * 
 * Core task types that define the structure of tasks in the queue.
 */

export interface Task {
  id?: string;
  type: string; // The queue name
  payload: any; // The data that gets sent to the target URL
  options?: TaskOptions;
  receiptHandle?: string; // AWS SQS specific
  popReceipt?: string; // Azure specific
}

export interface TaskOptions {
  priority?: number;
  scheduledFor?: number; // Unix timestamp in milliseconds
  maxRetries?: number;
  retryDelay?: number; // Delay in milliseconds between retries
  queueName?: string; // Override the default queue name
  exactlyOnce?: boolean; // Whether to ensure exactly-once processing
  targetUrl?: string; // URL to send the task to
  rootPath?: string; // Root path to append to the handler URL
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export interface TaskHandler {
  (task: Task): Promise<TaskResult>;
}

export interface TaskHandlerMap {
  [key: string]: TaskHandler;
} 