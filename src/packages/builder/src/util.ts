import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { BuildOptions, PluginBuild, OnResolveArgs, OnLoadArgs } from 'esbuild';

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
};

export const getExternalModules = (): string[] => {
	// These modules make the bundle much larger and are not required at runtime.
	const externalModules = new Set([
		...Object.keys(requireSilent('knex/package.json').browser),
		...Object.keys(requireSilent('@mikro-orm/knex/package.json').peerDependencies),
		'@mikro-orm/knex',
		'bun:ffi',
		'mock-aws-s3',
		'nock',
		'aws-sdk',
		'@aws-sdk/*',
		'libsql',
		'mariadb/callback',
	]);

	// The end user might explicitly require these, so we'll exclude them from the list of external modules.
	const requiredModules = new Set([
		// eslint-disable-next-line @typescript-eslint/no-require-imports
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

		// Filter only imports that are published to npm, they must not start with "/" or "./" or "../" or a drive letter
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]|^[A-Z]:\\/; // We are only interested in published packages
		build.onResolve({ filter }, async (args: OnResolveArgs) => {
			// If the package is already added esbuild external, we can skip it
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

// This esbuild plugin will add a start function if needed to the index.ts file
export const addStartFunctionIfNeeded = () => ({
	name: 'addStartFunctionIfNeeded',
	setup(build: PluginBuild) {
		build.onLoad({ filter: /src\/backend\/index\.ts$/ }, async (args: OnLoadArgs) => {
			const input = await fs.promises.readFile(args.path, 'utf8');

			// If the graphweaver app is a lambda function then there is nothing to change
			if (input.includes('graphweaver.handler')) {
				console.log('Lambda handler detected. No changes needed.');
				return { contents: input };
			}

			// Otherwise this is a standalone instance so we need to start the server
			console.log('Appending start command.');
			const startCommand = `\n
				console.log('Starting server on port: ' + (process.env.GRAPHWEAVER_API_PORT ?? '9001'));
				graphweaver.start({
					host: process.env.GRAPHWEAVER_API_HOST ?? '::',
					port: Number(process.env.GRAPHWEAVER_API_PORT ?? '9001'),
					path: process.env.GRAPHWEAVER_API_PATH ?? '/',
				});`;

			return { contents: `${input}${startCommand}` };
		});
	},
});

export const requireSilent = (module: string) => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require(module);
	} catch {
		// If we are here we might not have the package installed so we'll just return an empty object.
		return { browser: {}, peerDependencies: {}, dependencies: {} };
	}
};

export const checkTypescriptTypes = async () => {
	try {
		console.log(`Building TypeScript types with project references...`, process.cwd());

		// Step 1: Use tsc --build to respect project references and emit both .d.ts and .js files
		const buildChild = spawn('tsc --build', {
			stdio: 'inherit',
			shell: true,
		});

		await new Promise<void>((resolve, reject) => {
			buildChild.on('exit', function (exitCode) {
				if (exitCode !== 0) {
					reject(new Error('TypeScript build failed.'));
				} else {
					console.log(`TypeScript build completed successfully.`);
					resolve();
				}
			});
		});

		// Step 2: Clean up the JS files that TypeScript emitted (we only want .d.ts files)
		console.log(`Cleaning up JavaScript files...`);
		const { glob } = await import('glob');
		const jsFiles = await glob('./**/*.js', {
			ignore: ['./node_modules/**', './.graphweaver/**'],
		});

		let deletedCount = 0;
		for (const jsFile of jsFiles) {
			try {
				await fs.promises.unlink(jsFile);
				deletedCount++;
			} catch (error) {
				console.warn(`Could not delete ${jsFile}:`, error);
			}
		}

		console.log(`Cleaned up ${deletedCount} JavaScript files.`);
	} catch (error: any) {
		console.error(`TypeScript build process failed: ${error}`);
		throw new Error('TypeScript build process failed');
	}
};
