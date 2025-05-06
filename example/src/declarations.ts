// For more information about this file see https://dove.feathersjs.com/guides/cli/typescript.html
import { HookContext as FeathersHookContext, NextFunction } from '@feathersjs/feathers'
import { Application as FeathersApplication } from '@feathersjs/express'
import { QueueService, QueueRouter } from 'feathers-queue'
import { BooksService } from './services/books/books.class'
export type { NextFunction }
import { ApplicationConfiguration } from './configuration'

// The types for app.get(name) and app.set(name)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Configuration extends ApplicationConfiguration {}

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {
  gcpRouter: QueueRouter
  gcpSingle: QueueService
  books: BooksService
}

// The application instance type that will be used everywhere else
export type Application = FeathersApplication<ServiceTypes, Configuration>

// The context for hook functions - can be typed with a service class
export type HookContext<S = any> = FeathersHookContext<Application, S>
