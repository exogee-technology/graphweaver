#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const utils = require('@graphql-tools/utils');
const { writeFileSync } = require('fs');
const path = require('path');

const printSchema = async (output) => {
	const buildDir = path.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver } = await import(buildDir);

	if (!graphweaver?.schema) {
		console.warn(
			'No schema found. To generate types make sure that you export Graphweaver from your index file.'
		);
		process.exit(0);
	}

	const sdl = utils.printSchemaWithDirectives(graphweaver.schema);

	const args = process.argv; 

	console.log(args)

	if (args.includes('--output') || args.includes('-o')) {
		const outputIndex = args.indexOf('--output') + 1 || args.indexOf('-o') + 1;
		const outputDir = args[outputIndex];
		const outputPath = path.join(process.cwd(), outputDir);
		writeFileSync(outputPath, sdl);
		console.log(`Schema printed to ${outputPath}`);
		return;
	}

	console.log(sdl);
};

printSchema()
	.then(() => {
		process.exit(0);
	})
	.catch((e) => {
		console.error(
			`\n\nPrinting Schema Error: \n\n${e?.message ?? 'An error occurred while printing schema.'}\n\nPlease resolve the above error to print.`
		);
		process.exit(1);
	});
