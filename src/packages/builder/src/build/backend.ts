import path from 'path';
import { build, buildSync } from 'esbuild';
import rimrafCallback from 'rimraf';
import { promisify } from 'util';
import {
	AdditionalFunctionConfig,
	baseEsbuildConfig,
	buildOutputPathFor,
	inputPathFor,
	makeAllPackagesExternalPlugin,
	makeOptionalMikroOrmPackagesExternalPlugin,
} from '../util';
import CssModulesPlugin from 'esbuild-css-modules-plugin';

const rimraf = promisify(rimrafCallback);

export interface BackendBuildOptions {}

export const buildBackend = async (_: BackendBuildOptions) => {
	console.log('Building backend....');

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	// Put the index.js file in there.
	await build({
		...baseEsbuildConfig,

		// Anything in node_modules should be marked as external for running.
		plugins: [makeAllPackagesExternalPlugin(), CssModulesPlugin()],

		entryPoints: ['./src/backend/index.ts'],
		outfile: '.graphweaver/backend/index.js',
	});

	try {
		// Are there any custom additional functions we need to build?
		// If so, merge them in.

		const functions: AdditionalFunctionConfig[] = [
			{
				handlerPath: './src/backend/index',
				urlPath: '/graphql/v1',
				method: 'POST',
			},
		];

		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const config = require(path.join(process.cwd(), 'graphweaver-config'));
			console.log(config);
			functions.push(...config.backend.additionalFunctions);

			if (Array.isArray(config.backend.additionalFunctions)) {
				for (const backendFunction of functions) {
					// TODO: Better validation
					if (backendFunction.handlerPath) {
						console.log(
							` - Building ${backendFunction.handlerPath} => ${path.relative(
								process.cwd(),
								buildOutputPathFor(backendFunction.handlerPath)
							)}.js`
						);

						await build({
							...baseEsbuildConfig,

							plugins: [makeOptionalMikroOrmPackagesExternalPlugin()],

							entryPoints: [inputPathFor(backendFunction.handlerPath)],
							outfile: `${buildOutputPathFor(backendFunction.handlerPath)}.js`,
						});
					}
				}
			}
		} catch (error) {
			// It's perfectly fine if they don't have a graphweaver-config file, we just don't have anything to add.
		}
	} catch (error) {
		console.error(error);
	}

	console.log();
	console.log('Finished!');

	// Note, this will leave the ESBuild service process around:
	// https://github.com/evanw/esbuild/issues/985
	// console.log('Handles: ', (process as any)._getActiveHandles());
	//
	// We'll kill it with a process.exit(0) out in the main file when we know we're done.
};

export const buildBackendSync = (_: BackendBuildOptions) => {
	// Clear the folder
	rimrafCallback.sync(path.join('.graphweaver', 'backend'));

	// Are there any custom additional functions we need to build?
	// If so, merge them in.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { backend } = require(path.join(process.cwd(), 'graphweaver-config'));

	const functions: AdditionalFunctionConfig[] = [
		{
			handlerPath: './src/backend/index',
		},
		...backend.additionalFunctions,
	];

	if (Array.isArray(backend.additionalFunctions)) {
		for (const backendFunction of functions) {
			// TODO: Better validation
			if (backendFunction.handlerPath) {
				buildSync({
					...baseEsbuildConfig,

					plugins: [makeOptionalMikroOrmPackagesExternalPlugin()],

					entryPoints: [inputPathFor(backendFunction.handlerPath)],
					outfile: `${buildOutputPathFor(backendFunction.handlerPath)}.js`,
				});
			}
		}
	}

	// Note, this will leave the ESBuild service process around:
	// https://github.com/evanw/esbuild/issues/985
	// console.log('Handles: ', (process as any)._getActiveHandles());
	//
	// We'll kill it with a process.exit(0) out in the main file when we know we're done.
};
