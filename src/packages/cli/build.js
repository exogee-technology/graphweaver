/* eslint-disable @typescript-eslint/no-var-requires */
const { exec: nodeExec } = require('child_process');
const { promisify } = require('util');

const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');
const path = require('path');

const exec = promisify(nodeExec);

(async () => {
	// Build the CLI
	await build({
		entryPoints: ['./src/index.ts'],
		outdir: 'bin',
		bundle: true,
		platform: 'node',
		banner: { js: '#!/usr/bin/env node' },
		sourcemap: 'linked',
		external: [
			// Our dependencies will be installed in node_modules. The bundling is
			// just to ensure our own files are pulled in
			...Object.keys(dependencies),
			...Object.keys(devDependencies),
		],
	});

	// TODO: This won't work on Windows, guard accordingly.
	await exec('chmod 755 bin/index.js');
})();
