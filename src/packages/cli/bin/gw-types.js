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
			outdir: { type: 'string', default: './.graphweaver' },
		})
		.parse();

	const outdir = argv.outdir;

	const buildDir = import_path3.join(process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);
	const sdl = (0, import_utils.printSchemaWithDirectives)(graphweaver.schema);
	await (0, import_graphweaver_builder.codeGenerator)(sdl, outdir);
};

generateTypes()
	.then(() => {
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
