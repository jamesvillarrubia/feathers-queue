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

import type { Application, HookContext } from '../../declarations';
import { QueueRouter, QueueRouterParams } from 'feathers-queue';

export const gcpRouterPath = 'gcp-router';
export const gcpRouterMethods: Array<keyof QueueRouter> = ['find', 'get', 'create', 'patch', 'remove'];

export * from './gcp.schema';

// A configure function that registers the service and its hooks via `app.configure`
export const gcpRouter = (app: Application) => {  
  // Get the feathers-queue config
  const feathersQueueConfig = app.get('feathers-queue');
  
  const queueRouter = new QueueRouter({
      app,
      config: {
        ...feathersQueueConfig,
        app,
        provider: 'gcp'
      }
  });
    
    // Register the router as a service
  app.use(gcpRouterPath, queueRouter, {
      methods: gcpRouterMethods,
      events: []
  });

  // Initialize hooks
  app.service(gcpRouterPath).hooks({
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
    [gcpRouterPath]: QueueRouter;
  }
}
