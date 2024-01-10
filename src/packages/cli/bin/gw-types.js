#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
var import_graphweaver_builder = require('@exogee/graphweaver-builder');
var import_utils = require('@graphql-tools/utils');
var import_path3 = require('path');

var generateTypes = async () => {
	const buildDir = import_path3.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);

	if (!graphweaver?.schema) {
		console.warn(
			'No schema found. To generate types make sure that you export Graphweaver from your index file.'
		);
		process.exit(0);
	}

	// Get the types output path from the config
	const typesOutputPath = graphweaver.config.fileAutoGenerationOptions?.typesOutputPath;
	const typesOutput = ['./src/frontend/types.ts'];

	// If the typesOutputPath is a string or an array of strings, add it to the typesOutput array
	if (typesOutputPath && typeof typesOutputPath === 'string') {
		typesOutput.push(typesOutputPath);
	}
	if (typesOutputPath && Array.isArray(typesOutputPath)) {
		typesOutput.push(...typesOutputPath);
	}

	// Ensure that all paths have a filename and add one if it does not exist
	typesOutput.forEach((path, index) => {
		if (!path.includes('.ts')) {
			typesOutput[index] = `${path}/types.ts`;
		}
	});

	const sdl = (0, import_utils.printSchemaWithDirectives)(graphweaver.schema);
	await (0, import_graphweaver_builder.codeGenerator)(sdl, { typesOutput });
};

generateTypes()
	.then(() => {
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
