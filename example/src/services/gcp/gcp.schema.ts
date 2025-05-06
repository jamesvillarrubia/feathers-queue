// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema';
import { getValidator, querySyntax } from '@feathersjs/typebox';
import type { Static } from '@feathersjs/typebox';

import type { Application, HookContext } from '../../declarations';
import { dataValidator, queryValidator } from '../../validators';

// Import the queue schema from the core library
import { 
  queueSchema, 
  queueDataSchema, 
  queuePatchSchema, 
  queueQueryProperties,
  Queue,
  QueueData,
  QueuePatch,
  QueueQuery,
  QueueService,
  QueueRouter,
  QueueRouterParams
} from 'feathers-queue';


// Export the types from the core library
export type { Queue, QueueData, QueuePatch, QueueQuery };

// Create validators and resolvers
export const gcpValidator = getValidator(queueSchema, dataValidator);
export const gcpResolver = resolve<Queue, HookContext<QueueService | QueueRouter>>({});
export const gcpExternalResolver = resolve<Queue, HookContext<QueueService | QueueRouter>>({});

// Create data validators and resolvers
export const gcpDataValidator = getValidator(queueDataSchema, dataValidator);
export const gcpDataResolver = resolve<Queue, HookContext<QueueService | QueueRouter>>({});

// Create patch validators and resolvers
export const gcpPatchValidator = getValidator(queuePatchSchema, dataValidator);
export const gcpPatchResolver = resolve<Queue, HookContext<QueueService | QueueRouter>>({});

// Create query schema
export const gcpQuerySchema = querySyntax(queueQueryProperties);
export const gcpQueryValidator = getValidator(gcpQuerySchema, queryValidator);
export const gcpQueryResolver = resolve<QueueQuery, HookContext<QueueService | QueueRouter>>({});
