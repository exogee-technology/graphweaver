import { ConnectionOptions } from '../database';
import { closeConnection, generateDataEntityFiles, getMetadata } from './metadata';

export const introspection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	console.log('introspecting...');
	const metadata = await getMetadata(client, options);
	console.log(metadata);

	const dataEntities = generateDataEntityFiles(metadata);
	console.log(dataEntities);

	await closeConnection();
};
