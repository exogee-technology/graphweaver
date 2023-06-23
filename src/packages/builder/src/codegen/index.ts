import fs from 'fs';
import path from 'path';
import { codegen } from '@graphql-codegen/core';
import { printSchema, parse, GraphQLError } from 'graphql';
import { loadSchemaSync, loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { CodeFileLoader } from '@graphql-tools/code-file-loader';
import * as gqlTagPlugin from '@graphql-codegen/gql-tag-operations';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationPlugin from '@graphql-codegen/typescript-operations';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';

import { patch } from './patch';
import { createDirectoryIfNotExists } from '../util';

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
	try {
		const loadedDocuments = await loadDocuments([tsxDocumentLocation, tsDocumentLocation], {
			loaders: [new CodeFileLoader()],
		});

		const schema = loadSchemaSync(schemaFile, {
			loaders: [new GraphQLFileLoader()],
		});

		const printedSchema = parse(printSchema(schema));

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
		} else if (err instanceof GraphQLError) {
			console.log(err.message + `\n in ${err.source?.name}`);
		} else {
			throw err;
		}
	}
};
