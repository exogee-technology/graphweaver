import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { build } from 'esbuild';
import { rimraf } from 'rimraf';
import { AdditionalFunctionOptions, config } from '@exogee/graphweaver-config';

import {
	addStartFunctionIfNeeded,
	baseEsbuildConfig,
	buildOutputPathFor,
	checkPackageForNativeModules,
	checkTypescriptTypes,
	getBackendEntryMode,
	getExternalModules,
	inputPathFor,
	makeAllPackagesExternalPlugin,
} from '../util';

export const buildBackend = async () => {
	console.log('Building backend....');

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	const { onResolveEsbuildConfiguration } = config().build;

	// Put the index.js file in there.
	await build(
		onResolveEsbuildConfiguration({
			...baseEsbuildConfig,

			plugins: [
				// Anything in node_modules should be marked as external for running.
				makeAllPackagesExternalPlugin(),
			],

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
					plugins: [
						// Native modules are not yet supported.
						checkPackageForNativeModules(),

						// In non-lambda mode, the built output needs to actually start the server instead of just defining a function.
						// We don't do this in the .graphweaver build above because we don't want to start the server in our .graphweaver
						// built output, only in the dist version.
						addStartFunctionIfNeeded(),
					],
					entryPoints: [inputPathFor(backendFunction.handlerPath)],
					outfile: `${buildOutputPathFor(backendFunction.handlerPath)}.js`,
				})
			);

			await checkTypescriptTypes();

			if (result.metafile)
				writeFileSync(
					`${buildOutputPathFor(backendFunction.handlerPath)}.json`,
					JSON.stringify(result.metafile, null, 2)
				);
		}
	}

	const entryMode = await getBackendEntryMode();
	if (entryMode === 'azure') {
		const distDir = path.resolve(process.cwd(), 'dist');
		if (!existsSync(distDir)) {
			mkdirSync(distDir, { recursive: true });
		}
		writeFileSync(
			path.join(distDir, 'host.json'),
			JSON.stringify(
				{
					version: '2.0',
					extensionBundle: {
						id: 'Microsoft.Azure.Functions.ExtensionBundle',
						version: '[4.*, 5.0.0)',
					},
					extensions: {
						http: {
							routePrefix: '',
						},
					},
				},
				null,
				2
			)
		);
		// Azure Functions v4 Node entry: register the GraphQL handler with the app.
		writeFileSync(
			path.join(distDir, 'graphql.js'),
			`// Azure Functions v4 entry - registers Graphweaver Azure handler
const { app } = require('@azure/functions');
const { azureHandler } = require('./backend/index');

app.http('graphql', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: '/',
  handler: azureHandler,
});
`
		);
		console.log(' - Azure output written: dist/host.json, dist/graphql.js');
	}

	console.log('\nBackend Build Finished! ');

	// Note, this will leave the ESBuild service process around:
	// https://github.com/evanw/esbuild/issues/985
	// console.log('Handles: ', (process as any)._getActiveHandles());
	//
	// We'll kill it with a process.exit(0) out in the main file when we know we're done.
};
