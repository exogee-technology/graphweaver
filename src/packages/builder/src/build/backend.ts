import path from 'path';
import { build } from 'esbuild';
import rimrafCallback from 'rimraf';
import { promisify } from 'util';
import { AdditionalFunctionOptions, config } from '@exogee/graphweaver-config';

import {
	baseEsbuildConfig,
	buildOutputPathFor,
	inputPathFor,
	makeAllPackagesExternalPlugin,
	makeOptionalMikroOrmPackagesExternalPlugin,
} from '../util';

const rimraf = promisify(rimrafCallback);

export interface BackendBuildOptions {}

export const buildBackend = async (_: BackendBuildOptions) => {
	console.log('Building backend....');

	const externalModules = new Set([
		...Object.keys(require('knex/package.json').browser),
		...Object.keys(require('@mikro-orm/core/package.json').peerDependencies),
		...Object.keys(require('@mikro-orm/knex/package.json').peerDependencies),
		...Object.keys(require('type-graphql/package.json').peerDependencies),
		'@mikro-orm/knex',
		'bun:ffi',
		'mock-aws-s3',
		'nock',
		'aws-sdk',
	]);

	const requiredModules = new Set([
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

			await build(
				onResolveEsbuildConfiguration({
					...baseEsbuildConfig,
					minify: true,
					external: [...externalModules],
					plugins: [makeOptionalMikroOrmPackagesExternalPlugin()],

					entryPoints: [inputPathFor(backendFunction.handlerPath)],
					outfile: `${buildOutputPathFor(backendFunction.handlerPath)}.js`,
				})
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
