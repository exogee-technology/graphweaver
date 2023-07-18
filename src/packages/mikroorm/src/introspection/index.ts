import { ConnectionOptions, DatabaseType } from '../database';
import { generate } from './generate';

export const introspection = async (databaseType: DatabaseType, options: ConnectionOptions) =>
	generate(databaseType, options);
