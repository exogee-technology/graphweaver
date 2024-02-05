(async () => {
	const esbuild = await import('esbuild');
	const { glob } = await import('glob');

	const entryPoints = await glob('./src/**/*.ts', { ignore: './src/**/*.test.ts' });
	await esbuild.build({
		outdir: 'lib',
		format: 'cjs',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints,
	});
})();
