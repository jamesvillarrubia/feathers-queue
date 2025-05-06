import { Type, getValidator, defaultAppConfiguration } from '@feathersjs/typebox';
import { feathersQueueConfigurationSchema } from 'feathers-queue';
import type { Static } from '@feathersjs/typebox';

import { dataValidator } from './validators';


export const configurationSchema = Type.Intersect([
  defaultAppConfiguration,
  Type.Object({
    file: Type.String(),
    host: Type.String(),
    port: Type.Number(),
    public: Type.String()
  }),
  feathersQueueConfigurationSchema
]);


export type ApplicationConfiguration = Static<typeof configurationSchema>

export const configurationValidator = getValidator(configurationSchema, dataValidator)


