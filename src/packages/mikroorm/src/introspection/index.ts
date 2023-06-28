import { ConnectionOptions } from '../database';
import { getMetadata } from './metadata';

export const introspection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	console.log('introspecting...');
	const metadata = await getMetadata(client, options);
	console.log(metadata);

	for (const meta of metadata) {
		console.log(meta.class);
	}
};

//1. Generate Mikro Data Entities
//2. Convert to GW Data Entities
//3. Transcribe GW GraphQL entity from GW Data Entity
