/* eslint-disable @typescript-eslint/no-require-imports */
const { exec: nodeExec } = require('child_process');
const { promisify } = require('util');

const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');

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

	if (process.platform !== 'win32') {
		await exec('chmod 755 bin/index.js');
	}
})();
