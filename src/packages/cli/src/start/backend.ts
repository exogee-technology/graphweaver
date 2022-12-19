import path from 'path';
import rimrafCallback from 'rimraf';
import { build, BuildOptions } from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { promisify } from 'util';
import dotenv from 'dotenv';

const rimraf = promisify(rimrafCallback);

const makeAllPackagesExternalPlugin = () => ({
	name: 'make-all-packages-external',
	setup(build: any) {
		const filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Must not start with "/" or "./" or "../"
		build.onResolve({ filter }, ({ path }: any) => {
			// On Windows, packages in the monorepo are resolved as full file paths starting with C:\ ...
			// And Go (used by esbuild) does not support regex with negative lookaheads
			return { path, external: !/^[C-Z]:\\/.test(path) };
		});
	},
});

const baseEsbuildConfig: BuildOptions = {
	// Anything in node_modules should be marked as external for running.
	plugins: [makeAllPackagesExternalPlugin(), cssModulesPlugin()],

	minify: false,
	bundle: true,
	sourcemap: true,
	platform: 'node',
	target: ['node14'],
	format: 'cjs',
	watch: true,
};

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

interface AdditionalFunctionConfig {
	handlerPath: string;
	handlerName?: string;
	urlPath: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
}

const inputPathFor = (userSuppliedPath: string) =>
	path.resolve(process.cwd(), 'src', 'backend', userSuppliedPath);

const outputPathFor = (userSuppliedPath: string) =>
	path.resolve(process.cwd(), '.graphweaver', 'backend', userSuppliedPath);

export const startBackend = async () => {
	// Get ready for our config.
	const backendFunctions = { ...builtInBackendFunctions };

	// Clear the folder
	await rimraf(path.join('.graphweaver', 'backend'));

	// Put the index.js file in there.
	await build({
		...baseEsbuildConfig,

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
						outfile: `${outputPathFor(additionalFunction.handlerPath)}.js`,
					});

					backendFunctions[
						`user-function:${additionalFunction.handlerPath}-${additionalFunction.method}-${additionalFunction.urlPath}`
					] = {
						handler: `${outputPathFor(additionalFunction.urlPath)}.${
							additionalFunction.handlerName || 'handler'
						}`,
						environment: dotenv.config().parsed,
						events: [
							{
								http: {
									path: additionalFunction.urlPath,
									method: additionalFunction.method || 'ANY',
									cors: true,
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
						LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'trace',
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
		}
	);

	console.log('GraphWeaver Backend Listening at:');
	await slsOffline.start();
};
