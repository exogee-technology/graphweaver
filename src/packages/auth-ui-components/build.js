import esbuild from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

const flags = process.argv.slice(0);
const flagIncludes = (flagName) => !!flags.find((flag) => flag === `--${flagName}`);

(async () => {
	const { glob } = await import('glob');
	const entryPoints = await glob('./src/**/*.{ts,tsx,css}');

	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		sourcemap: 'linked',
		entryPoints,
		plugins: [cssModulesPlugin(), svgrPlugin({ exportType: 'named' })],
		watch: flagIncludes('watch'),
	});
})();
