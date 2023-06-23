import fs from 'fs';
import path from 'path';
import { printSchema } from 'graphql';
import { executeCodegen } from '@graphql-codegen/cli';
import { buildSchemaSync } from 'type-graphql';
import { createDirectoryIfNotExists } from '../util';
import { patchFile } from './patch';

const outputDirectory = './src/__generated__/';
const outputPath = path.join(process.cwd(), outputDirectory);

export const exportTypes = async () => {
	// Read the exported resolvers and if we find them build the schema
	const { resolvers } = await import(path.join(process.cwd(), './.graphweaver/backend/index.js'));

	// We can only build the types if we have access to the resolvers
	if (!resolvers) return;

	try {
		const schema = buildSchemaSync({ resolvers });
		const printedSchema = printSchema(schema);

		const files = await executeCodegen({
			cwd: process.cwd(),
			schema: printedSchema,
			documents: ['./src/**/*.tsx', './src/**/*.ts'],
			generates: {
				[outputDirectory]: {
					preset: 'client',
				},
			},
		});
		createDirectoryIfNotExists(outputPath);

		for (const file of files) {
			const filePath = path.join(process.cwd(), file.filename);
			fs.writeFileSync(filePath, patchFile(file.filename, file.content), 'utf8');
		}
	} catch (err: any) {
		const defaultStateMessage = `Unable to find any GraphQL type definitions for the following pointers:`;
		if (err.message && err.message.includes(defaultStateMessage)) {
			// do nothing for now and silently fail
		} else {
			console.log(err.message + `\n in ${err.source?.name}`);
		}
	}
};
