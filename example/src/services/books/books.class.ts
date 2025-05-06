// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers';
import debug from 'debug';

import type { Application } from '../../declarations';
import type { Books, BooksData, BooksPatch, BooksQuery } from './books.schema';

export type { Books, BooksData, BooksPatch, BooksQuery };

// Create a debug namespace for the books service
const debugBooks = debug('feathers:books');

export interface BooksServiceOptions {
  app: Application;
}

export interface BooksParams extends Params<BooksQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class BooksService<ServiceParams extends BooksParams = BooksParams>
  implements ServiceInterface<Books, BooksData, ServiceParams, BooksPatch>
{
  constructor(public options: BooksServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Books[]> {
    return [];
  }

  async get(id: Id, _params?: ServiceParams): Promise<Books> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`,
    };
  }

  async create(data: BooksData, params?: ServiceParams): Promise<Books>;
  async create(data: BooksData[], params?: ServiceParams): Promise<Books[]>;
  async create(data: BooksData | BooksData[], params?: ServiceParams): Promise<Books | Books[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    debugBooks('Creating new book: %O', data);

    return {
      id: 0,
      ...data,
    };
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: BooksData, _params?: ServiceParams): Promise<Books> {
    return {
      id: 0,
      ...data,
    };
  }

  async patch(id: NullableId, data: BooksPatch, _params?: ServiceParams): Promise<Books> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data,
    };
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Books> {
    return {
      id: 0,
      text: 'removed',
    };
  }
}

export const getOptions = (app: Application) => {
  return { app };
};
