#!/usr/bin/env tsx

import 'reflect-metadata';
import { buildSchema } from '@exogee/graphweaver';
import { codeGenerator } from '@exogee/graphweaver-builder';
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
	const outdir = process.argv[2] || './.graphweaver';
	const resolvers = await importResolvers();
	const schema = await buildSchema({
		resolvers,
	});
	await codeGenerator(schema, outdir);
};

buildTypes();
