import esbuild from 'esbuild';
void (async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		sourcemap: 'linked',
		entryPoints: ['src/index.ts'],
	});
})();
