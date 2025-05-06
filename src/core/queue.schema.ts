/**
 * @feathers-cloud/task-queue
 * 
 * Core queue schema that defines the structure of queue data for Feathers services.
 * This schema is used by the queue service to validate and transform data.
 */

import { Type } from '@feathersjs/typebox';

// Define the base queue schema
export const queueSchema = Type.Object(
  {
    id: Type.String(),
    type: Type.String(),
    payload: Type.Any(),
    options: Type.Optional(
      Type.Object({
        priority: Type.Optional(Type.Number()),
        scheduledFor: Type.Optional(Type.Number()),
        maxRetries: Type.Optional(Type.Number()),
        retryDelay: Type.Optional(Type.Number()),
        queueName: Type.Optional(Type.String()),
        exactlyOnce: Type.Optional(Type.Boolean()),
        targetUrl: Type.Optional(Type.String()),
        rootPath: Type.Optional(Type.String()),
      })
    ),
    receiptHandle: Type.Optional(Type.String()),
    popReceipt: Type.Optional(Type.String()),
    status: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
  },
  { $id: 'Queue', additionalProperties: false }
);

// Define the queue stats schema
export const queueStatsSchema = Type.Object(
  {
    pending: Type.Number(),
    processing: Type.Number(),
    completed: Type.Number(),
    failed: Type.Number(),
  },
  { $id: 'QueueStats', additionalProperties: false }
);

// Define the queue result schema
export const queueResultSchema = Type.Object(
  {
    success: Type.Boolean(),
    result: Type.Optional(Type.Any()),
    error: Type.Optional(
      Type.Object({
        code: Type.String(),
        message: Type.String(),
        details: Type.Optional(Type.Any()),
        stack: Type.Optional(Type.String()),
      })
    ),
  },
  { $id: 'QueueResult', additionalProperties: false }
);

// Schema for creating new entries
export const queueDataSchema = Type.Object(
  {
    id: Type.Optional(Type.String()),
    type: Type.String(),
    payload: Type.Any(),
    options: Type.Optional(
      Type.Object({
        priority: Type.Optional(Type.Number()),
        scheduledFor: Type.Optional(Type.Number()),
        maxRetries: Type.Optional(Type.Number()),
        retryDelay: Type.Optional(Type.Number()),
        queueName: Type.Optional(Type.String()),
        exactlyOnce: Type.Optional(Type.Boolean()),
        targetUrl: Type.Optional(Type.String()),
        rootPath: Type.Optional(Type.String()),
      })
    ),
  },
  { $id: 'QueueData', additionalProperties: false }
);

// Schema for updating existing entries
export const queuePatchSchema = Type.Partial(queueSchema, {
  $id: 'QueuePatch',
});

// Schema for allowed query properties
export const queueQueryProperties = Type.Object({
  id: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  createdAt: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String()),
});

// Export types for TypeScript
export type Queue = {
  id: string;
  type: string;
  payload: any;
  options?: {
    priority?: number;
    scheduledFor?: number;
    maxRetries?: number;
    retryDelay?: number;
    queueName?: string;
    exactlyOnce?: boolean;
    targetUrl?: string;
    rootPath?: string;
  };
  receiptHandle?: string;
  popReceipt?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QueueData = {
  id?: string;
  type: string;
  payload: any;
  options?: {
    priority?: number;
    scheduledFor?: number;
    maxRetries?: number;
    retryDelay?: number;
    queueName?: string;
    exactlyOnce?: boolean;
    targetUrl?: string;
    rootPath?: string;
  };
};

export type QueuePatch = Partial<Queue>;

export type QueueQuery = {
  id?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

export type QueueStatsType = {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
};

export type QueueResult = {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
};

export const feathersQueueConfigurationSchema = 
Type.Object({
  'feathers-queue': Type.Object({
    routing: Type.Boolean(),
    queues: Type.Record(Type.String(), Type.Any()),
    defaults: Type.Object({
      provider: Type.String(),
      projectId: Type.String(),
      location: Type.String(),
      queueName: Type.String(),
      taskHandlerUrl: Type.Optional(Type.String()),
      handlerRootPath: Type.Optional(Type.String()),
      allowedDomains: Type.Optional(Type.Array(Type.String())),
      maxRetries: Type.Optional(Type.Number()),
      retryDelay: Type.Optional(Type.Number()),
      defaultQueue: Type.Optional(Type.String()), 
      exactlyOnce: Type.Optional(Type.Boolean()),
      priority: Type.Optional(Type.Number()),
      scheduledFor: Type.Optional(Type.Number()),
      targetUrl: Type.Optional(Type.String()),
      rootPath: Type.Optional(Type.String()),
    }, { $id: 'QueueDefaults' , additionalProperties: true }),
  }, { $id: 'FeathersQueueConfig', additionalProperties: true }),
}, { $id: 'FeathersQueueRootConfig', additionalProperties: true });