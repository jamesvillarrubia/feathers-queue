// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers';
import express, {
  rest,
  json,
  urlencoded,
  cors,
  serveStatic,
  notFound,
  errorHandler,
} from '@feathersjs/express';
import configuration from '@feathersjs/configuration';

import type { Application } from './declarations';
import { configurationValidator } from './configuration';
import { logger } from './logger';
import { logError } from './hooks/log-error';
import { services } from './services/index';

const app: Application = express(feathers());

// Load app configuration
app.configure(configuration(configurationValidator));
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Host the public folder
console.log('FILE', app.get('file'));
app.use('/', serveStatic('public'));

// Configure services and real-time functionality
app.configure(rest());

app.configure(services);

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(errorHandler({ logger }));

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError],
  },
  before: {},
  after: {},
  error: {},
});
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: [],
});

export { app };
