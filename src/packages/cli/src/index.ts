import yargs from 'yargs';
import {
	BackendStartOptions,
	StartOptions,
	analyseBundle,
	buildBackend,
	buildFrontend,
	startBackend,
	startFrontend,
} from '@exogee/graphweaver-builder';
import { create } from './create';

yargs
	.env('GRAPHWEAVER')
	.command({
		command: ['create'],
		describe: 'Create a graphweaver project in various ways.',
		handler: create,
	})
	.command({
		command: ['analyse [target]', 'analyze [target]', 'a [target]'],
		describe: 'Instruments your graphweaver project in various ways.',
		builder: (yargs) =>
			yargs.positional('target', {
				type: 'string',
				choices: ['bundle'],
				default: 'bundle',
				describe: 'The thing to analyse.',
			}),
		handler: async ({ target }) => {
			if (target === 'bundle') {
				await analyseBundle();
			}
		},
	})
	.command({
		command: ['build [environment]', 'b [environment]'],
		describe: 'Builds your graphweaver project for deployment.',
		builder: (yargs) =>
			yargs
				.positional('environment', {
					type: 'string',
					choices: ['backend', 'frontend', 'all'],
					default: 'all',
					describe: 'Choose whether you want to build the backend, frontend, or both.',
				})
				.option('adminUiBase', {
					type: 'string',
					default: '/',
					describe: 'Specify the base path for the Admin UI',
				}),
		handler: async ({ environment, adminUiBase }) => {
			if (environment === 'backend' || environment === 'all') {
				await buildBackend({});
			}
			if (environment === 'frontend' || environment === 'all') {
				await buildFrontend({ adminUiBase });
			}

			// Note, this will leave the ESBuild service process around:
			// https://github.com/evanw/esbuild/issues/985
			// console.log('Handles: ', (process as any)._getActiveHandles());
			//
			// It does not give us a way to kill it gracefully, so we'll do it here.
			process.exit(0);
		},
	})
	.command({
		command: ['start [environment]', 's [environment]'],
		describe: 'Runs a development version of the project locally.',
		builder: (yargs) =>
			yargs
				.positional('environment', {
					type: 'string',
					choices: ['backend', 'frontend', 'all'],
					default: 'all',
					describe: 'Choose whether you want to run the backend, frontend, or both.',
				})
				.option('host', {
					type: 'string',
					describe: 'Specify a host to listen on e.g. --host 0.0.0.0',
				})
				.option('port', {
					type: 'number',
					default: 9000,
					describe:
						'Specify a base port to listen on. Frontend will start on this port, and backend will start on port+1',
				}),
		handler: async ({ environment, ...args }) => {
			if (environment === 'backend' || environment === 'all') {
				await startBackend(args as BackendStartOptions);
			}
			if (environment === 'frontend' || environment === 'all') {
				await startFrontend(args as StartOptions);
			}
		},
	})
	.parse();
