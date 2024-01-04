#!/usr/bin/env tsx

import 'reflect-metadata';
import { buildSchema } from '@exogee/graphweaver';
import { codeGenerator } from '@exogee/graphweaver-builder';
import fs from 'fs';
import path from 'path';

const importResolvers = async () => {
	const resolverPath = path.join(process.cwd(), './src/backend/schema/index');
	const { resolvers } = await import(resolverPath);

	if (!resolvers) {
		throw new Error(
			'Could not generate types please export your resolvers from the schema index file'
		);
	}

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

	const dirPath = path.join(process.cwd(), './.graphweaver');
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath);
	}

	const typesPath = path.join(process.cwd(), './.graphweaver/types.ts');
	fs.promises.writeFile(typesPath, types, 'utf8');
};

buildTypes();
