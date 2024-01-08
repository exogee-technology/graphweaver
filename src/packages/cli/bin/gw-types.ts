#!/usr/bin/env tsx

import 'reflect-metadata';
import { buildSchema } from '@exogee/graphweaver';
import { codeGenerator } from '@exogee/graphweaver-builder';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';

const importResolvers = async (resolversPath: string) => {
	const resolverPath = path.join(process.cwd(), resolversPath);
	const { resolvers } = await import(resolverPath);

	if (!resolvers) {
		throw new Error(
			'Could not generate types please export your resolvers from the schema index file'
		);
	}

	return resolvers;
};

export const buildTypes = async () => {
	const argv = await yargs(hideBin(process.argv))
		.options({
			outdir: { type: 'string', default: './.graphweaver' },
			resolvers: { type: 'string', default: './src/backend/schema/index' },
		})
		.parse();

	const outdir = argv.outdir;
	const resolversPath = argv.resolvers;

	console.log('Generating types...');
	console.log(`Output directory: ${outdir}`);
	console.log(`Resolvers path: ${resolversPath}`);

	const resolvers = await importResolvers(resolversPath);

	console.log('Resolvers imported.\n\n');

	const schema = await buildSchema({
		resolvers,
	});

	console.log('Schema built.\n\n');

	await codeGenerator(schema, outdir);

	console.log('Types generated.\n\n');

	// Exit the process
	process.exit(0);
};

buildTypes();
