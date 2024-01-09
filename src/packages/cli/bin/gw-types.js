#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
var import_graphweaver_builder = require('@exogee/graphweaver-builder');
var import_utils = require('@graphql-tools/utils');
var import_path3 = require('path');
var yargs = require('yargs');
var yargs_helpers = require('yargs/helpers');

var generateTypes = async () => {
	const argv = await yargs(yargs_helpers.hideBin(process.argv))
		.options({
			outDir: { type: 'string', default: './.graphweaver' },
		})
		.parse();

	const outDir = argv.outdir;

	console.log(`Generating types in ${outDir}`);

	const buildDir = import_path3.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);

	if (!graphweaver?.schema) {
		console.warn(
			'No schema found. To generate types make sure that you export Graphweaver from your index file.'
		);
		process.exit(0);
	}

	const sdl = (0, import_utils.printSchemaWithDirectives)(graphweaver.schema);
	await (0, import_graphweaver_builder.codeGenerator)(sdl, outDir);
};

generateTypes()
	.then(() => {
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
