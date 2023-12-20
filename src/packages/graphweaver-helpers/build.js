const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

(async () => {
	const esbuild = await import('esbuild');
	await esbuild.build({
		outdir: 'dist',
		format: 'cjs',
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: 'linked',
		entryPoints: ['src/index.ts'],
		watch: flagIncludes('watch'),
		external: ['@exogee/graphweaver', 'type-graphql', 'graphql-type-json'],
	});
})();
