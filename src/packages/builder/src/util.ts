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

export const getExternalModules = (): string[] => {
	// These modules make the bundle much larger and are not required for at runtime.
	const externalModules = new Set([
		...Object.keys(requireSilent('knex/package.json').browser),
		...Object.keys(requireSilent('@mikro-orm/core/package.json').peerDependencies),
		...Object.keys(requireSilent('@mikro-orm/knex/package.json').peerDependencies),
		...Object.keys(requireSilent('type-graphql/package.json').peerDependencies),
		'@mikro-orm/knex',
		'bun:ffi',
		'mock-aws-s3',
		'nock',
		'aws-sdk',
	]);

	// The end user might explicitly require these, so we'll exclude them from the list of external modules.
	const requiredModules = new Set([
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		...Object.keys(require(path.join(process.cwd(), './package.json')).dependencies),
	]);

	for (const value of requiredModules) {
		externalModules.delete(value);
	}

	console.log("The following modules are external and won't be bundled:");
	console.log(externalModules);
	console.log(
		'If you want to bundle any of these, you can add them as a dependency in your package.json file.'
	);

	return [...externalModules];
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
		const externals = build.initialOptions.external || [];

		// Filter only imports that are external, must not start with "/" or "./" or "../" or a drive letter
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // We are only interested in external packages
		build.onResolve({ filter }, async (args: OnResolveArgs) => {
			// If the package is already external we don't need to check it
			if (externals.includes(args.path)) {
				return undefined;
			}
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
