import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';

(async () => {
	const { glob } = await import('glob');
	const entryPoints = await glob('./src/**/*.{ts,tsx,css}');

	await esbuild.build({
		outdir: 'lib',
		outbase: 'src',
		format: 'esm',
		sourcemap: 'linked',
		entryPoints,
		loader: {
			'.module.css': 'css',
		},
		plugins: [svgrPlugin({ exportType: 'named' })],
	});
})();
