/* eslint-disable @typescript-eslint/no-var-requires */
const { exec: nodeExec } = require('child_process');
const { promisify } = require('util');

const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');
const { copyFile } = require('fs/promises');
const path = require('path');

const exec = promisify(nodeExec);

(async () => {
	await build({
		entryPoints: ['./src/index.ts'],
		outdir: 'bin',
		bundle: true,
		platform: 'node',
		banner: { js: '#!/usr/bin/env node' },
		external: [
			// Our dependencies will be installed in node_modules. The bundling is
			// just to ensure our own files are pulled in
			...Object.keys(dependencies),
			...Object.keys(devDependencies),
		],
	});

	await exec('chmod 755 bin/index.js');
})();
