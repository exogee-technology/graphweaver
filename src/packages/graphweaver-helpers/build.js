(async () => {
	const esbuild = await import('esbuild');
	await esbuild.build({
		outdir: 'dist',
		format: 'cjs',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints: ['src/index.ts'],
		bundle: true,
		external: ['@exogee/graphweaver', 'type-graphql', 'graphql-type-json'],
	});
})();
