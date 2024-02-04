import path from 'path';
import { BuildOptions, Plugin } from 'esbuild';

export interface AdditionalFunctionConfig {
	handlerPath: string;
	handlerName?: string;
	urlPath: string;
	cors?: boolean;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
}

export const inputPathFor = (userSuppliedPath: string) =>
	path.resolve(process.cwd(), userSuppliedPath);

export const devOutputPathFor = (userSuppliedPath: string) =>
	path.resolve(process.cwd(), '.graphweaver', userSuppliedPath);

export const buildOutputPathFor = (userSuppliedPath: string) => {
	const components = userSuppliedPath.split(path.sep);

	return path.resolve(
		process.cwd(),
		'dist',
		...components.filter((component) => component !== 'src')
	);
};

export const baseEsbuildConfig: BuildOptions = {
	minify: false,
	bundle: true,
	sourcemap: true,
	platform: 'node',
	target: ['node18'],
	format: 'cjs',
	keepNames: true,
	metafile: true,
	external: [
		'tedious',
		'pg-query-stream',
		'oracledb',
		'bun:ffi',
		'mysql',
		'mysql2',
		'sqlite3',
		'better-sqlite3',
		'mock-aws-s3',
		'nock',
		'aws-sdk',
	],
};

export const makeAllPackagesExternalPlugin = (): Plugin => ({
	name: 'make-all-packages-external',
	setup(build) {
		// On Windows, packages in the monorepo are resolved as full file paths starting with C:\ ...
		// And Go (used by esbuild) does not support regex with negative lookaheads
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // Must not start with "/" or "./" or "../" or a drive letter
		build.onResolve({ filter }, ({ path }) => {
			return { path, external: true };
		});
	},
});

export const makeOptionalMikroOrmPackagesExternalPlugin = (): Plugin => ({
	name: 'make-mikro-orm-packages-external',
	setup(build) {
		const filter = /^@mikro-orm/;
		build.onResolve({ filter }, ({ path }) => {
			// If it's available locally then it should be bundled,
			// otherwise let it be external in the resulting bundle.
			try {
				// If we are running Graphweaver build as part of an end-to-end
				// test, then let's look up the end-to-end node_modules dir,
				// rather than the one in the 'builder' package
				const resolvedPath = require.resolve(path, {
					...(process.cwd().includes('end-to-end')
						? { paths: ['../end-to-end/node_modules'] }
						: {}),
				});

				return { path: resolvedPath, external: false };
			} catch (error) {
				// Ok, it's out.
				console.log('Externalising package:', path);
				return { path, external: true };
			}
		});
	},
});
