import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

(async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		bundle: true,
		minify: false,
		sourcemap: 'linked',
		external: [
			'@exogee/graphweaver-admin-ui-components',
			'graphql',
			'react',
			'react-dom',
			'react-router',
			'react-router-dom',
			'@remix-run/router',
		],
		entryPoints: ['src/index.ts'],
		plugins: [cssModulesPlugin(), svgrPlugin({ exportType: 'named' })],
		watch: flagIncludes('watch'),
	});
})();
