import fs from 'fs';
import path from 'path';
import { codegen } from '@graphql-codegen/core';
import { printSchema, parse, GraphQLSchema, buildSchema } from 'graphql';
import { loadSchemaSync, loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { CodeFileLoader } from '@graphql-tools/code-file-loader';

import * as addPlugin from '@graphql-codegen/add';
import * as gqlTagPlugin from '@graphql-codegen/gql-tag-operations';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationPlugin from '@graphql-codegen/typescript-operations';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';

const schemaFile = path.join(process.cwd(), './.graphweaver/backend/schema.gql');
const documentLocation = path.join(process.cwd(), './src/admin-ui/custom-fields/link.tsx');

const outputFile = path.join(process.cwd(), './.graphweaver/queries.ts');

export const exportTypes = async () => {
	const loadedDocuments = await loadDocuments([documentLocation], {
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
		// [`gen-dts`]: gqlTagPlugin,
	};

	const files = Object.entries(plugins).map(async ([key, plugin]) => {
		const config = {
			schema: printedSchema,
			documents: loadedDocuments,
			plugins: [
				{
					[key]: {},
				},
			],
			pluginMap: {
				[key]: plugin,
			},
			config: {},
			filename: 'test.ts',
		};
		const output = await codegen(config);
		return output;
	});

	const data = await Promise.all(files);
	fs.writeFileSync(outputFile, data.join('\n'), 'utf8');
};
