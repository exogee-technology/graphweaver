import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { copy } from 'esbuild-plugin-copy';

const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

(async () => {
	await esbuild.build({
		outdir: 'dist',
		format: 'esm',
		bundle: true,
		minify: false,
		sourcemap: 'linked',
		external: [
			// This can't be bundled because it's virtual and supplied by
			// our vite plugin directly.
			'virtual:graphweaver-user-supplied-custom-pages',

			// And these can't because they're peer dependencies, and we need to use
			// the version supplied by the ultimate consumer of the library.
			'graphql',
			'react',
			'react-dom',
			'react-router',
			'react-router-dom',
			'@remix-run/router',
			'@exogee/graphweaver-admin-ui-components',
		],
		entryPoints: ['src/main.tsx'],
		plugins: [
			cssModulesPlugin({ inject: true }),
			svgrPlugin({ exportType: 'named' }),
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
		watch: flagIncludes('watch'),
	});
})();
