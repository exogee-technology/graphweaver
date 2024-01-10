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
	const codegenOptions = graphweaver.config.fileAutoGenerationOptions;

	const sdl = (0, import_utils.printSchemaWithDirectives)(graphweaver.schema);
	await (0, import_graphweaver_builder.codeGenerator)(sdl, codegenOptions);
};

generateTypes()
	.then(() => {
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
