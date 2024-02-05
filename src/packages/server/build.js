const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');

(async () => {
	await build({
		outdir: 'lib',
		format: 'cjs',
		platform: 'node',
		sourcemap: 'linked',
		bundle: true,
		entryPoints: ['./src/index.ts'],
		external: [
			// Our dependencies will be installed in node_modules. The bundling is
			// just to ensure our own files are pulled in
			...Object.keys(dependencies),
			...Object.keys(devDependencies),
		],
	});
})();
