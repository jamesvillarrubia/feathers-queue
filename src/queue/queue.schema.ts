import { Type } from '@feathersjs/typebox';

// Pub/Sub specific error codes
export enum PubSubErrorCode {
  // Pub/Sub API Errors
  TOPIC_NOT_FOUND = 'TOPIC_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  INTERNAL = 'INTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',

  // Queue Processing Errors
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  INVALID_ACTION = 'INVALID_ACTION',
  METHOD_NOT_FOUND = 'METHOD_NOT_FOUND',
  INVALID_METHOD_ARGS = 'INVALID_METHOD_ARGS',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  DEAD_LETTER = 'DEAD_LETTER',
  PUBLISH_FAILED = 'PUBLISH_FAILED',
}

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const QueueSchema = Type.Object({
  id: Type.String(),
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('processing'),
    Type.Literal('completed'),
    Type.Literal('failed'),
  ]),
  payload: Type.Object({
    service: Type.String(),
    action: Type.String(),
    queueName: Type.Optional(Type.String()),
    data: Type.Any(),
    id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    params: Type.Optional(Type.Any()),
    query: Type.Optional(Type.Any()),
    method: Type.Optional(Type.String()),
    methodArgs: Type.Optional(Type.Array(Type.Any())),
  }),
  metadata: Type.Object({
    messageId: Type.String(),
    timestamp: Type.Number(),
    priority: Type.Number(),
    queueName: Type.String(),
    scheduledFor: Type.Optional(Type.Number()),
  }),
  processingHistory: Type.Array(
    Type.Object({
      timestamp: Type.Number(),
      status: Type.String(),
      error: Type.Optional(Type.String()),
    })
  ),
});

export const QueueConfigSchema = Type.Object({
  // Basic configuration
  name: Type.String(),
  topic: Type.String(),
  subscription: Type.String(),
  process: Type.Optional(Type.Boolean()),

  // Topic configuration
  labels: Type.Optional(Type.Record(Type.String(), Type.String())),
  messageStoragePolicy: Type.Optional(Type.Object({
    allowedPersistenceRegions: Type.Array(Type.String())
  })),

  // Subscription configuration
  pushConfig: Type.Optional(Type.Object({
    pushEndpoint: Type.String(),
    attributes: Type.Optional(Type.Record(Type.String(), Type.String())),
    oidcToken: Type.Optional(Type.Object({
      serviceAccountEmail: Type.String(),
      audience: Type.String()
    }))
  })),
  ackDeadlineSeconds: Type.Optional(Type.Number()),
  messageRetentionDuration: Type.Optional(Type.String()),
  enableMessageOrdering: Type.Optional(Type.Boolean()),
  deadLetterPolicy: Type.Optional(Type.Object({
    deadLetterTopic: Type.String(),
    maxDeliveryAttempts: Type.Number()
  })),
  retryPolicy: Type.Optional(Type.Object({
    minimumBackoff: Type.String(),
    maximumBackoff: Type.String()
  }))
});

export type Queue = {
  id: string;
  status: QueueStatus;
  payload: {
    service: string;
    action: string;
    queueName?: string;
    data: any;
    id?: string | number;
    params?: any;
    query?: any;
    method?: string;
    methodArgs?: any[];
  };
  metadata: {
    messageId: string;
    timestamp: number;
    priority: number;
    queueName: string;
    scheduledFor?: number;
  };
  processingHistory: Array<{
    timestamp: number;
    status: string;
    error?: string;
  }>;
};

export interface QueueConfig {
  name: string;
  topic: string;
  subscription: string;
  process?: boolean;
  maxDeliveryAttempts?: number;
  ackDeadlineSeconds?: number;
  messageRetentionDuration?: string;
  pushEndpoint?: string;
  labels?: Record<string, string>;
  messageStoragePolicy?: {
    allowedPersistenceRegions: string[];
  };
  enableMessageOrdering?: boolean;
  retryPolicy?: {
    minimumBackoff?: string;
    maximumBackoff?: string;
  };
  deadLetterPolicy?: {
    deadLetterTopic: string;
    maxDeliveryAttempts: number;
  };
}

export type QueueQuery = {
  status?: QueueStatus;
  service?: string;
  action?: string;
  queueName?: string;
  priority?: number;
  scheduledFor?: number;
};
