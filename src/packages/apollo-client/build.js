import esbuild from 'esbuild';
void (async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		sourcemap: 'linked',
		// Each module gets its own output so consumers can import `./normalise` without pulling
		// in @apollo/client, which is only a peer dependency.
		entryPoints: ['src/index.ts', 'src/normalise.ts', 'src/trusted-documents.ts'],
	});
})();
