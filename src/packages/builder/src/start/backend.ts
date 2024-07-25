import path from 'path';
import { rimraf } from 'rimraf';
import { build } from 'esbuild';
import dotenv from 'dotenv';
import os from 'os';

// @ts-expect-error There are no types for this module, but we're not calling anything on it directly
// so we don't actually care.
import serverlessLogger from '@serverless/utils/log';
// @ts-expect-error There are no types for this module either, but we're not calling anything on it directly
// so we don't actually care.
import logNode from 'log-node';
logNode();

import {
	baseEsbuildConfig,
	inputPathFor,
	makeAllPackagesExternalPlugin,
	devOutputPathFor,
	checkPackageForNativeModules,
	getExternalModules,
} from '../util';

import { config } from '@exogee/graphweaver-config';

const isWindows = () => os.platform() === 'win32';

const getProjectRoot = () => {
	const cwd = process.cwd();

	if (!isWindows()) return cwd;

	const root = path.parse(cwd).root; // This is either '/' or 'C:\' on windows.
	const [_, projectRoot] = cwd.split(root);
	return projectRoot;
};

const builtInBackendFunctions: Record<string, any> = {
	'graphweaver-backend': {
		handler: path.join(getProjectRoot(), '.graphweaver', 'backend', 'index.handler'),
		environment: dotenv.config().parsed,
		events: [
			{
				http: {
					path: '/{proxy+}',
					method: 'ANY',
					cors: true,
				},
			},
		],
	},
};

export interface BackendStartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port: number /** Port to listen on, default is 9001 */;
}

export const startBackend = async ({ host, port }: BackendStartOptions) => {
	console.log('Starting Backend...');

	const { additionalFunctions } = config().backend;
	const { onResolveServerlessOfflineConfiguration, onResolveEsbuildConfiguration } = config().start;
	// Get ready for our config.
	const backendFunctions = { ...builtInBackendFunctions };

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	// Check if the prod build works, this build is not used at this stage, this is an early warning system to check for native modules.
	const checkNativeModules = build(
		onResolveEsbuildConfiguration({
			...baseEsbuildConfig,
			write: false, // disable writing to disk

			external: getExternalModules(),
			plugins: [checkPackageForNativeModules()],

			entryPoints: [inputPathFor('./src/backend/index')],
			outfile: `${devOutputPathFor('./src/backend/index')}.js`,
		})
	);

	// Put the index.js file in there.
	const buildBackend = build(
		onResolveEsbuildConfiguration({
			...baseEsbuildConfig,

			// Anything in node_modules should be marked as external for running.
			plugins: [makeAllPackagesExternalPlugin()],

			entryPoints: ['./src/backend/index.ts'],
			outfile: '.graphweaver/backend/index.js',
		})
	);

	await Promise.all([checkNativeModules, buildBackend]);

	const buildDir = path.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
	const { graphweaver, handler } = await import(buildDir);

	if (!handler) {
		if (additionalFunctions.length > 0) {
			throw new Error(
				'Additional functions are defined but no handler is exported. Please export a handler function to run Graphweaver in serverless mode.'
			);
		}

		graphweaver.start({ host, port: port + 1, path: '/' });
		return;
	}

	// Are there any custom additional functions we need to build?
	for (const additionalFunction of additionalFunctions) {
		if (
			// TODO: Better validation
			additionalFunction.handlerPath &&
			additionalFunction.method &&
			additionalFunction.urlPath
		) {
			await build(
				onResolveEsbuildConfiguration({
					...baseEsbuildConfig,

					entryPoints: [inputPathFor(additionalFunction.handlerPath)],
					outfile: `${devOutputPathFor(additionalFunction.handlerPath)}.js`,
				})
			);

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

	// Sadly there's no easy way to trigger Serverless programmatically:
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

	// Shim in a kind of serverless config so the plugin kicks up and does its job.
	const slsOffline = new ServerlessOffline(
		onResolveServerlessOfflineConfiguration({
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
					},
				},
				custom: {
					'serverless-offline': {
						noPrependStageInUrl: true,
						useInProcess: true,
						...{ host: host ?? '::' },
						...(port
							? {
									httpPort: port + 1,
									lambdaPort: port + 2,
								}
							: {}),
					},
				},
				getAllFunctions: () => Object.keys(backendFunctions),
				getFunction: (key: string) => ({ ...backendFunctions[key], name: key }),
				getAllEventsInFunction: (key: string) => backendFunctions[key].events,
			},
		}),
		{
			printOutput: true,
			reloadHandler: true,
		},
		serverlessLogger
	);

	console.log(`Backend Log Level: ${logLevel}`);
	await slsOffline.start();
};
