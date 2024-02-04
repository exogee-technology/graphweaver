import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

(async () => {
	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		bundle: true,
		minify: false,
		sourcemap: 'linked',
		external: [
			'@exogee/graphweaver-admin-ui-components',
			'@remix-run/router',
			'formik',
			'graphql',
			'react',
			'react-dom',
			'react-router',
			'react-router-dom',
		],
		entryPoints: ['src/index.ts'],
		plugins: [cssModulesPlugin(), svgrPlugin({ exportType: 'named' })],
	});
})();
