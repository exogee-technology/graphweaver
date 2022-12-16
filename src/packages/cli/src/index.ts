import yargs from 'yargs';
import { buildBackend, buildFrontend } from './build';
import { analyseBundle } from './bundle';
import { startBackend, startFrontend } from './start';

yargs
	.env('GRAPHWEAVER')
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
			yargs.positional('environment', {
				type: 'string',
				choices: ['backend', 'frontend', 'all'],
				default: 'all',
				describe: 'Choose whether you want to build the backend, frontend, or both.',
			}),
		handler: async ({ environment }) => {
			if (environment === 'backend' || environment === 'all') {
				await buildBackend();
			}
			if (environment === 'frontend' || environment === 'all') {
				await buildFrontend();
			}
		},
	})
	.command({
		command: ['start [environment]', 's [environment]'],
		describe: 'Runs a development version of the project locally.',
		builder: (yargs) =>
			yargs.positional('environment', {
				type: 'string',
				choices: ['backend', 'frontend', 'all'],
				default: 'all',
				describe: 'Choose whether you want to run the backend, frontend, or both.',
			}),
		handler: async ({ environment }) => {
			if (environment === 'backend' || environment === 'all') {
				await startBackend();
			}
			if (environment === 'frontend' || environment === 'all') {
				await startFrontend();
			}
		},
	})
	.parse();
