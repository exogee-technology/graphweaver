import fs from 'fs';
import path from 'path';
import { codegen } from '@graphql-codegen/core';
import { printSchema, parse, GraphQLError } from 'graphql';
import { loadDocuments } from '@graphql-tools/load';
import { CodeFileLoader } from '@graphql-tools/code-file-loader';
import * as gqlTagPlugin from '@graphql-codegen/gql-tag-operations';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationPlugin from '@graphql-codegen/typescript-operations';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';

import { patch } from './patch';
import { createDirectoryIfNotExists } from '../util';
import { buildSchemaSync } from 'type-graphql';

// Location of the apps schema file
const schemaFile = path.join(process.cwd(), './.graphweaver/backend/schema.gql');
// Location of the apps tsx files
const tsxDocumentLocation = path.join(process.cwd(), './src/**/*.tsx');
// Location of the apps ts files
const tsDocumentLocation = path.join(process.cwd(), './src/**/*.ts}');
// Location of where in the app we should save the generated types and functions
const outputDirectory = path.join(process.cwd(), './src/__generated__');
// Location of the file for the generated types and functions
const filename = `${outputDirectory}/gql.ts`;

export const exportTypes = async () => {
	// Read the exported resolvers and if we find them build the schema
	const { resolvers } = await import(path.join(process.cwd(), './.graphweaver/backend/index.js'));

	// We can only build the types if we have access to the resolvers
	if (!resolvers) return;

	try {
		const schema = buildSchemaSync({ resolvers });
		const printedSchema = parse(printSchema(schema));

		const loadedDocuments = await loadDocuments([tsxDocumentLocation, tsDocumentLocation], {
			loaders: [new CodeFileLoader()],
		});

		const plugins = {
			[`typed-document-node`]: typedDocumentNodePlugin,
			typescript: typescriptPlugin,
			[`typescript-operations`]: typescriptOperationPlugin,
			[`gen-dts`]: gqlTagPlugin,
		};

		const files = Object.entries(plugins).map(async ([key, plugin]) => {
			const config = {
				schema: printedSchema,
				documents: loadedDocuments,
				plugins: [
					...(key === 'gen-dts'
						? []
						: [
								{
									[key]: {},
								},
						  ]),
				],
				pluginMap: {
					[key]: plugin,
				},
				config: {},
				filename,
			};
			const output = await codegen(config);
			return output;
		});

		const contents = await Promise.all(files);
		const data = patch(contents.join('\n'));
		createDirectoryIfNotExists(outputDirectory);
		fs.writeFileSync(filename, data, 'utf8');
	} catch (err: any) {
		const defaultStateMessage = `Unable to find any GraphQL type definitions for the following pointers:`;
		if (err.message && err.message.includes(defaultStateMessage)) {
			// do nothing for now and silently fail
		} else {
			console.log(err.message + `\n in ${err.source?.name}`);
		}
	}
};
