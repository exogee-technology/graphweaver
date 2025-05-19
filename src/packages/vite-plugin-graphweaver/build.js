import { readFileSync } from 'fs';

(async () => {
	const esbuild = await import('esbuild');
	const { glob } = await import('glob');

	const entryPoints = await glob('./src/**/*.ts');

	await esbuild.build({
		outdir: 'lib',
		format: 'esm',
		platform: 'node',
		sourcemap: 'linked',
		entryPoints,
		plugins: [
			{
				name: 'add-js-extensions',
				setup(build) {
					build.onLoad({ filter: /\.ts$/ }, async (args) => {
						const contents = readFileSync(args.path, 'utf8');
						const transformed = contents.replace(/from ['"]([^'"]+)['"]/g, (match, importPath) => {
							// Skip node_modules imports and imports that already have extensions
							if (importPath.startsWith('.') && !importPath.endsWith('.js')) {
								return `from '${importPath}.js'`;
							}
							return match;
						});
						return { contents: transformed, loader: 'ts' };
					});
				},
			},
		],
	});
})();
