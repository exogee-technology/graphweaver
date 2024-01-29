#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const builder = require('@exogee/graphweaver-builder');
const utils = require('@graphql-tools/utils');
const path = require('path');

const generateTypes = async () => {
	const buildDir = path.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);

	if (!graphweaver?.schema) {
		console.warn(
			'No schema found. To generate types make sure that you export Graphweaver from your index file.'
		);
	}

	// Get the types output path from the config
	const codegenOptions = graphweaver.config.fileAutoGenerationOptions;

	const sdl = utils.printSchemaWithDirectives(graphweaver.schema);
	await builder.codeGenerator(sdl, codegenOptions);
};

generateTypes().catch((e) => {
	console.error(e);
	process.exit(1);
});
