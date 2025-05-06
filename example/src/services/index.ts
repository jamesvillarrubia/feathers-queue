import { books } from './books/books';
import { gcpRouter } from './gcp/gcp-router';
import { gcpSingle } from './gcp/gcp-single';
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations';

export const services = (app: Application) => {
  app.configure(books);
  app.configure(gcpSingle);
  app.configure(gcpRouter);
  // All services will be registered here
};
