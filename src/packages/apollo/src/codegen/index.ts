import fs from 'fs';
import path from 'path';
import { codegen } from '@graphql-codegen/core';
import { printSchema, parse, GraphQLSchema } from 'graphql';
import * as typescriptPlugin from '@graphql-codegen/typescript';

const outputFile = path.join(process.cwd(), './.graphweaver/types.d.ts');

export const exportTypes = async (schema: GraphQLSchema) => {
	const config = {
		documents: [],
		config: {},
		filename: outputFile,
		schema: parse(printSchema(schema)),
		plugins: [
			{
				typescript: {}, // Here you can pass configuration to the plugin
			},
		],
		pluginMap: {
			typescript: typescriptPlugin,
		},
	};
	const output = await codegen(config);
	await fs.writeFileSync(outputFile, output, 'utf8');
};
