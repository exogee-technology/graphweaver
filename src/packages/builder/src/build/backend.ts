import path from 'path';
import { writeFileSync } from 'fs';
import { build } from 'esbuild';
import { rimraf } from 'rimraf';
import { AdditionalFunctionOptions, config } from '@exogee/graphweaver-config';

import {
	baseEsbuildConfig,
	buildOutputPathFor,
	checkPackageForNativeModules,
	getExternalModules,
	inputPathFor,
	makeAllPackagesExternalPlugin,
} from '../util';

export interface BackendBuildOptions {}

export const buildBackend = async (_: BackendBuildOptions) => {
	console.log('Building backend....');

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	const { onResolveEsbuildConfiguration } = config().build;

	// Put the index.js file in there.
	await build(
		onResolveEsbuildConfiguration({
			...baseEsbuildConfig,

			// Anything in node_modules should be marked as external for running.
			plugins: [makeAllPackagesExternalPlugin()],

			entryPoints: ['./src/backend/index.ts'],
			outfile: '.graphweaver/backend/index.js',
		})
	);

	// Are there any custom additional functions we need to build?
	// If so, merge them in.

	const functions: AdditionalFunctionOptions[] = [
		{
			handlerPath: './src/backend/index',
			urlPath: '/graphql/v1',
			method: 'POST',
		},
	];

	const { additionalFunctions } = config().backend;
	functions.push(...additionalFunctions);

	for (const backendFunction of functions) {
		// TODO: Better validation
		if (backendFunction.handlerPath) {
			console.log(
				` - Building ${backendFunction.handlerPath} => ${path.relative(
					process.cwd(),
					buildOutputPathFor(backendFunction.handlerPath)
				)}.js`
			);

			const result = await build(
				onResolveEsbuildConfiguration({
					...baseEsbuildConfig,
					minify: true,
					metafile: true,
					external: getExternalModules(),
					plugins: [checkPackageForNativeModules()],
					entryPoints: [inputPathFor(backendFunction.handlerPath)],
					outfile: `${buildOutputPathFor(backendFunction.handlerPath)}.js`,
				})
			);

			if (result.metafile)
				writeFileSync(
					`${buildOutputPathFor(backendFunction.handlerPath)}.json`,
					JSON.stringify(result.metafile, null, 2)
				);
		}
	}

	console.log('\nBackend Build Finished! ');

	// Note, this will leave the ESBuild service process around:
	// https://github.com/evanw/esbuild/issues/985
	// console.log('Handles: ', (process as any)._getActiveHandles());
	//
	// We'll kill it with a process.exit(0) out in the main file when we know we're done.
};
