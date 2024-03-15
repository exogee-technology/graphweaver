import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

(async () => {
	const { glob } = await import('glob');
	const entryPoints = await glob('./src/**/*.{ts,tsx,css}');

	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		sourcemap: 'linked',
		entryPoints,
		plugins: [cssModulesPlugin(), svgrPlugin({ exportType: 'named' })],
	});
})();
