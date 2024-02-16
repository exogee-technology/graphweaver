import path from 'path';
import { BuildOptions, PluginBuild, OnResolveArgs } from 'esbuild';

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
	setup(build: PluginBuild) {
		// On Windows, packages in the monorepo are resolved as full file paths starting with C:\ ...
		// And Go (used by esbuild) does not support regex with negative lookaheads
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // Must not start with "/" or "./" or "../" or a drive letter
		build.onResolve({ filter }, ({ path }: OnResolveArgs) => {
			return { path, external: true };
		});
	},
});

// A function that will return true if the package.json file has any native modules
const isNative = (pkg: any) =>
	(pkg.dependencies &&
		(pkg.dependencies.bindings ||
			pkg.dependencies.prebuild ||
			pkg.dependencies.nan ||
			pkg.dependencies['node-pre-gyp'] ||
			pkg.dependencies['node-gyp-build'])) ||
	pkg.gypfile ||
	pkg.binary;

// esbuild plugin that will check the package.json file for each package
export const checkPackageForNativeModules = () => ({
	name: 'has-native-modules',
	setup(build: PluginBuild) {
		// A set to store the packages that have native modules
		const modulesWithNativeModules = new Set<string>();

		// Filter only imports that are external, must not start with "/" or "./" or "../" or a drive letter
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // We are only interested in external packages
		build.onResolve({ filter }, async (args: OnResolveArgs) => {
			// get the package.json file for the imported path
			const packageInfo = requireSilent(`${args.path}/package.json`);
			// Check if the package has native modules and add it to the set
			if (isNative(packageInfo)) {
				console.warn(`The package ${args.path} has native modules and cannot be bundled.`);
				modulesWithNativeModules.add(args.path);
			}

			return undefined;
		});

		build.onEnd(() => {
			if (modulesWithNativeModules.size > 0) {
				throw new Error(
					`The following packages have native modules and cannot be bundled: ${Array.from(
						modulesWithNativeModules
					).join(', ')}`
				);
			}
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
