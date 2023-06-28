import { ConnectionOptions } from '../database';
import { generate } from './generate';

export const introspection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	console.log('introspecting...');

	const files = await generate(client, options);

	for (const file of files) {
		if (file.filepath === `./backend/schema/job/entity.ts`) {
			console.log(file.contents);
		}
	}

	return files;
};
