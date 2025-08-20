import { ConnectionOptions, DatabaseType } from '../database.js';
import { generate } from './generate.js';

export const introspection = async (databaseType: DatabaseType, options: ConnectionOptions) =>
	generate(databaseType, options);
