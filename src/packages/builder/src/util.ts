import path from 'path';
import fs from 'fs';
import { BuildOptions, Message } from 'esbuild';

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
	watch: true,
	keepNames: true,
};

export const makeAllPackagesExternalPlugin = () => ({
	name: 'make-all-packages-external',
	setup(build: any) {
		// On Windows, packages in the monorepo are resolved as full file paths starting with C:\ ...
		// And Go (used by esbuild) does not support regex with negative lookaheads
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // Must not start with "/" or "./" or "../" or a drive letter
		build.onResolve({ filter }, ({ path }: any) => {
			return { path, external: true };
		});
	},
});

export const requireSilent = (module: string) => {
	try {
		return require(module);
	} catch {
		// If we are here we might not have the package installed so we'll just return an empty object.
		return { browser: {}, peerDependencies: {}, dependencies: {} };
	}
};
