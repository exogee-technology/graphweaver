(async () => {
	const esbuild = await import('esbuild');
	const { glob } = await import('glob');

	// Get all entry points for the build but not the test files
	const entryPoints = await glob('./src/**/*.ts', {
		ignore: ['./src/**/*.test.ts'],
	});
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints,
	});
})();
