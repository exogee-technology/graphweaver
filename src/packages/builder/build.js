/* eslint-disable @typescript-eslint/no-var-requires */
// import { exec as nodeExec } from 'child_process';

// const { exec: nodeExec } = require('child_process');
import { promisify } from 'util';
// const { promisify } = require('util');

import { readFileSync } from 'fs';
import { build } from 'esbuild';
// const { build } = require('esbuild');

// eslint-disable-next-line prettier/prettier
// import { dependencies, devDependencies } from "./package.json" with { type: "json" };
// const { dependencies, devDependencies } = require('./package.json');
// const path = require('path');

// import { path } from 'path';

// const exec = promisify(nodeExec);

// Load the contents of package.json into a variable
const loadJSON = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));

const pjson = loadJSON('./package.json');

(async () => {
	await build({
		entryPoints: ['./src/index.ts'],
		outdir: 'lib',
		bundle: true,
		platform: 'node',
		banner: { js: '#!/usr/bin/env node' },
		sourcemap: 'linked',
		external: [
			// Our dependencies will be installed in node_modules. The bundling is
			// just to ensure our own files are pulled in
			...Object.keys(pjson.dependencies),
			...Object.keys(pjson.devDependencies),
		],
	});
})();
