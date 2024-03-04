import esbuild from 'esbuild';
(async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		sourcemap: 'linked',
		entryPoints: ['src/index.ts'],
	});
})();
