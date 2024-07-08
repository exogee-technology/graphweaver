import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

(async () => {
	const { glob } = await import('glob');
	const entryPoints = await glob('./src/**/*.{ts,tsx,css}');

	await esbuild.build({
		outdir: 'dist',
		outbase: 'src',
		format: 'esm',
		minify: false,
		sourcemap: 'linked',
		entryPoints,
		loader: {
			'.module.css': 'css',
		},
		plugins: [
			copy({
				assets: [
					{
						from: ['./src/assets/**/*'],
						to: ['./assets'],
					},
					{
						from: ['./src/index.html'],
						to: ['./index.html'],
					},
				],
			}),
		],
	});
})();
