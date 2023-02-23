import path from 'path';
import { build, buildSync } from 'esbuild';
import rimrafCallback from 'rimraf';
import { promisify } from 'util';
import {
	AdditionalFunctionConfig,
	baseEsbuildConfig,
	buildOutputPathFor,
	inputPathFor,
	makeOptionalMikroOrmPackagesExternalPlugin,
} from '../util';

const rimraf = promisify(rimrafCallback);

export interface BackendBuildOptions {}

export const buildBackend = async (_: BackendBuildOptions) => {
	console.log('Building backend...');

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	try {
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
