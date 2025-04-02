/**
 * @feathers-cloud/task-queue
 * 
 * Core task types that define the structure of tasks in the queue.
 */

export interface Task {
  id: string;
  type: string;
  payload: any;
  metadata?: {
    priority?: number;
    scheduledFor?: number;
    retryCount?: number;
    maxRetries?: number;
    retryDelay?: number;
    createdAt?: number;
    updatedAt?: number;
  };
}

export interface TaskOptions {
  priority?: number;
  scheduledFor?: number;
  maxRetries?: number;
  retryDelay?: number;
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