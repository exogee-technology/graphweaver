import { ConnectionOptions } from '../database';
import { generate } from './generate';

export const introspection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) =>
	generate(client, options);
