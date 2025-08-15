(async () => {
	const esbuild = await import('esbuild');
	const { glob } = await import('glob');
	const fs = await import('node:fs/promises');
	const entryPoints = await glob('./src/**/*.ts', { ignore: '**/*.test.ts' });

	await fs.rm('lib', { recursive: true, force: true });

	await esbuild.build({
		outdir: 'lib',
		format: 'cjs',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints,
	});
})();
