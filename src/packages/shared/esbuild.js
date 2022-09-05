const esbuild = require('esbuild');

esbuild
	.build({
		entryPoints: ['src/index.ts'],
		outdir: 'lib',
		bundle: true,
		sourcemap: true,
		minify: true,
		splitting: false,
		format: 'cjs',
		target: ['esnext'],
	})
	.catch(() => process.exit(1));
