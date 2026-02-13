import { ConnectionOptions, DatabaseType } from '../database';
import { generate, APIOptions } from './generate';

export const introspection = async (databaseType: DatabaseType, options: ConnectionOptions, apiOptions?: APIOptions) =>
	generate(databaseType, options, apiOptions);
