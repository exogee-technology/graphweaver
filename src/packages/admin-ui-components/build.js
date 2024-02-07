import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { copy } from 'esbuild-plugin-copy';

const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

const { glob } = await import('glob');
const entryPoints = await glob('./src/**/*.{ts,tsx,css}');

(async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		bundle: false,
		minify: false,
		sourcemap: 'linked',
		entryPoints,
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
		watch: flagIncludes('watch'),
	});
})();
