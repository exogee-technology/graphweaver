import { DatabaseType } from '../database';
import { generate, APIOptions, IntrospectionOptions } from './generate';

export type { IntrospectionOptions };

export const introspection = async (
	databaseType: DatabaseType,
	options: IntrospectionOptions,
	apiOptions?: APIOptions
) => generate(databaseType, options, apiOptions);

export * from './ssl';
