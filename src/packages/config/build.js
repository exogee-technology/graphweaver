/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');

(async () => {
	await build({
		entryPoints: ['./src/index.ts'],
		outdir: 'lib',
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
})();
