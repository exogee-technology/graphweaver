import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { copy } from 'esbuild-plugin-copy';

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
		plugins: [
			cssModulesPlugin(),
			svgrPlugin({ exportType: 'named' }),
			copy({
				assets: [
					{
						from: ['./src/assets/**/*'],
						to: ['./assets'],
					},
				],
			}),
		],
	});
})();
