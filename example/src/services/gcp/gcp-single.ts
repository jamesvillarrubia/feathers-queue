// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
// import { authenticate } from '@feathersjs/authentication';

import { hooks as schemaHooks } from '@feathersjs/schema';

import {
  gcpDataValidator,
  gcpPatchValidator,
  gcpQueryValidator,
  gcpResolver,
  gcpExternalResolver,
  gcpDataResolver,
  gcpPatchResolver,
  gcpQueryResolver,
} from './gcp.schema';

import type { Application } from '../../declarations';
import { QueueService, getGCPQueueOptions } from 'feathers-queue';
import { BooksService } from '../books/books.class';

export const gcpSinglePath = 'gcp-single';
export const gcpSingleMethods: Array<keyof QueueService> = ['find', 'get', 'create', 'patch', 'remove'];

// A configure function that registers the service and its hooks via `app.configure`
export const gcpSingle = (app: Application) => {
  // Get the config for a specific queue with routing disabled
  const queueConfig = getGCPQueueOptions(app, 'queue-1');
  
  // Create a new QueueService with the config
  const queueService = new QueueService({
    app,
    config: {
      ...queueConfig,
      app,
      provider: 'gcp'
    }
  });
  
  
  // Register the service
  app.use(gcpSinglePath, queueService, {
    methods: gcpSingleMethods,
    events: []
  });
  
  // Initialize hooks
  app.service(gcpSinglePath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(gcpExternalResolver),
        schemaHooks.resolveResult(gcpResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(gcpQueryValidator),
        schemaHooks.resolveQuery(gcpQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(gcpDataValidator),
        schemaHooks.resolveData(gcpDataResolver),
      ],
      patch: [
        schemaHooks.validateData(gcpPatchValidator),
        schemaHooks.resolveData(gcpPatchResolver),
      ],
      remove: [],
    },
    after: {
      all: [],
    },
    error: {
      all: [],
    },
  });
};

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [gcpSinglePath]: QueueService;
  }
} 