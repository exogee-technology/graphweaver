import { buildSchema } from 'type-graphql';
import fs from 'fs';
import path from 'path';

import { codeGenerator } from '../codegen';

const importResolvers = async () => {
	const resolverPath = path.join(process.cwd(), './dist/backend/index');
	const { resolvers } = await import(resolverPath);
	return resolvers;
};

export const buildTypes = async () => {
	const resolvers = await importResolvers();
	const schema = await buildSchema({
		resolvers,
	});
	const files = await codeGenerator(schema);
	const types = files?.find((file) => file.filename === 'src/types.generated.ts')?.content;

	if (!types) {
		throw new Error('Could not generate types');
	}

	const typesPath = './.graphweaver/types.ts';
	fs.promises.writeFile(typesPath, types, 'utf8');
};
