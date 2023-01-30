import path from 'path';
import rimrafCallback from 'rimraf';
import { build } from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { promisify } from 'util';
import dotenv from 'dotenv';
import {
	AdditionalFunctionConfig,
	baseEsbuildConfig,
	inputPathFor,
	makeAllPackagesExternalPlugin,
	devOutputPathFor,
} from '../util';

// The Serverless Offline logger should report any errors and such to the console as well.
// This is how we configure the Serverless log reporter to use console.log().
import '@serverless/utils/log-reporters/node';

const rimraf = promisify(rimrafCallback);

const builtInBackendFunctions: Record<string, any> = {
	'graphweaver-backend': {
		handler: path.join(process.cwd(), '.graphweaver', 'backend', 'index.handler'),
		environment: dotenv.config().parsed,
		events: [
			{
				http: {
					path: 'graphql/v1/{proxy+}',
					method: 'ANY',
					cors: true,
				},
			},
		],
	},
};

export const startBackend = async () => {
	console.log('Starting backend...');

	// Get ready for our config.
	const backendFunctions = { ...builtInBackendFunctions };

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	// Put the index.js file in there.
	await build({
		...baseEsbuildConfig,

		// Anything in node_modules should be marked as external for running.
		plugins: [makeAllPackagesExternalPlugin(), cssModulesPlugin()],

		entryPoints: ['./src/backend/index.ts'],
		outfile: '.graphweaver/backend/index.js',
	});

	// Are there any custom additional functions we need to build?
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { backend } = require(path.join(process.cwd(), 'graphweaver-config'));

		if (Array.isArray(backend.additionalFunctions)) {
			for (const additionalFunction of backend.additionalFunctions as AdditionalFunctionConfig[]) {
				if (
					// TODO: Better validation
					additionalFunction.handlerPath &&
					additionalFunction.method &&
					additionalFunction.urlPath
				) {
					await build({
						...baseEsbuildConfig,

						entryPoints: [inputPathFor(additionalFunction.handlerPath)],
						outfile: `${devOutputPathFor(additionalFunction.handlerPath)}.js`,
					});

					backendFunctions[
						`user-function:${additionalFunction.handlerPath}-${additionalFunction.method}-${additionalFunction.urlPath}`
					] = {
						handler: `${devOutputPathFor(additionalFunction.handlerPath)}.${
							additionalFunction.handlerName || 'handler'
						}`,
						environment: dotenv.config().parsed,
						events: [
							{
								http: {
									path: additionalFunction.urlPath,
									method: additionalFunction.method || 'ANY',
									cors: additionalFunction.cors ?? true,
								},
							},
						],
					};
				}
			}
		}
	} catch (error) {
		// We don't actually care if this fails, we just won't load
		// your custom functions.
		console.warn('Error while building additional functions: ', error);
	}

	// Sadly there's no easy way to trigger Serverless programatically:
	// https://github.com/serverless/serverless/issues/1678
	// And also there's no way to have the config file outside of the project files:
	// https://github.com/serverless/serverless/issues/9095
	// So we're going to just reach past serverless itself, and tell Serverless
	// offline to run all by its lonesome, passing in just the config it needs.

	// We also can't import this at the top because of a CJS / ESM mismatch.

	// We don't have types for serverless offline and that's ok.
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { default: ServerlessOffline } = await import('serverless-offline');

	const logLevel = process.env.LOGGING_LEVEL || 'trace';
	const SLS_DEBUG = process.env.SLS_DEBUG || (logLevel === 'trace' ? '*' : undefined);

	const slsOffline = new ServerlessOffline(
		// Shim in a kind of serverless config so the plugin kicks up and does its job.
		{
			config: {
				servicePath: '/',
			},
			service: {
				provider: {
					name: 'aws',
					timeout: 30,

					environment: {
						// In dev it's helpful to trace.
						LOGGING_LEVEL: logLevel,
						SLS_DEBUG,
					},
				},
				custom: {
					'serverless-offline': {
						noPrependStageInUrl: true,
						useWorkerThreads: true,
					},
				},
				getAllFunctions: () => Object.keys(backendFunctions),
				getFunction: (key: string) => backendFunctions[key],
				getAllEventsInFunction: (key: string) => backendFunctions[key].events,
			},
		},
		{
			printOutput: true,
		}
	);

	console.log(`GraphWeaver Backend log level '${logLevel}' - starting Serverless Offline...`);
	await slsOffline.start();
};
