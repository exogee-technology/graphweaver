import yargsFactory from 'yargs/yargs';
import chokidar from 'chokidar';
import semver from 'semver';
import {
	Source,
	StartOptions,
	analyseBundle,
	buildBackend,
	buildFrontend,
	startBackend,
	startFrontend,
} from '@exogee/graphweaver-builder';
import { Backend, init } from './init';
import { initAuth, AuthMethod, authMethods } from './auth';
import { importDataSource } from './import';
import { version } from '../package.json';
import { generateTypes, printSchema } from './tasks';
import * as path from 'path';
import { config } from '@exogee/graphweaver-config';

const MINIMUM_NODE_SUPPORTED = '18.0.0';

const yargs = yargsFactory(process.argv.slice(2));

yargs
	.scriptName('graphweaver')
	.env('GRAPHWEAVER')
	.check(() => {
		if (semver.lt(process.version, MINIMUM_NODE_SUPPORTED)) {
			throw new Error(
				`\n\nERROR:\nPlease upgrade Node.js to at least version v${MINIMUM_NODE_SUPPORTED} or above.\n\n`
			);
		}
		return true;
	})
	.command({
		command: ['init'],
		describe: 'Create a graphweaver project in various ways.',
		builder: (yargs) =>
			yargs
				.option('name', {
					type: 'string',
					describe: 'The name of this project.',
				})
				.option('backend', {
					type: 'array',
					describe: 'Specify one or more data sources.',
					choices: ['postgres', 'mssql', 'mysql', 'rest', 'sqlite'],
				})
				.option('useVersion', {
					type: 'string',
					describe: 'Specify a version of Graphweaver to use.',
				}),
		handler: async (argv) => {
			const version = argv.useVersion;
			const name = argv.name;
			const backends = argv.backend?.flatMap((backend: string) => {
				switch (backend) {
					case 'postgres':
						return Backend.Postgres;
					case 'mysql':
						return Backend.Mysql;
					case 'mssql':
						return Backend.Mssql;
					case 'rest':
						return Backend.Rest;
					case 'sqlite':
						return Backend.Sqlite;
					default:
						return [];
				}
			});

			console.log('Initialising a new Graphweaver project...');
			if (name) console.log(`Project Name: ${name}`);
			if (backends) console.log(`Backends: ${backends.join(',')}`);
			if (version) console.log(`Graphweaver Version: ${version}`);
			console.log();

			init({ name, version, backends });
		},
	})
	.command({
		command: ['import [source]'],
		describe: 'Inspect a data source and then import its entities.',
		builder: (yargs) =>
			yargs
				.positional('source', {
					type: 'string',
					choices: ['mssql', 'mysql', 'postgresql', 'sqlite'],
					describe: 'The data source to import.',
				})
				.option('database', {
					type: 'string',
					describe: 'Specify the database name.',
				})
				.option('host', {
					type: 'string',
					describe: 'Specify the database server hostname.',
				})
				.option('port', {
					type: 'number',
					describe: 'Specify the database server port.',
				})
				.option('password', {
					type: 'string',
					describe: 'Specify the database server password.',
				})
				.option('user', {
					type: 'string',
					describe: 'Specify the database server user.',
				})
				.option('overwrite', {
					alias: 'o',
					type: 'boolean',
					describe: 'Overwrite all existing files.',
				})
				.option('clientGeneratedPrimaryKeys', {
					type: 'boolean',
					describe: 'Whether to allow client generated primary keys for introspected entities.',
				}),
		handler: async ({ source, database, host, port, password, user, overwrite, clientGeneratedPrimaryKeys }) => {
			console.log('Importing data source...');
			// Do we have any pre-configured options?
			const { import: importOptions } = config();

			if (importOptions) {
				if (source === undefined) source = importOptions.source;
				if (database === undefined) database = importOptions.dbName;
				if (host === undefined) host = importOptions.host;
				if (!port) port = importOptions.port;
				if (user === undefined) user = importOptions.user;
				if (password === undefined) password = importOptions.password;
				if (overwrite === undefined) overwrite = importOptions.overwrite;
				if (clientGeneratedPrimaryKeys === undefined) clientGeneratedPrimaryKeys = importOptions.clientGeneratedPrimaryKeys;
			}

			if (source) console.log(`Source: ${source}`);
			if (database) console.log(`Database Name: ${database}`);
			if (host) console.log(`Database Host: ${host}`);
			if (port) console.log(`Database Port: ${port}`);
			if (user) console.log(`Database User: ${user}`);

			if (
				source !== 'mssql' &&
				source !== 'mysql' &&
				source !== 'postgresql' &&
				source !== 'sqlite'
			) {
				throw new Error(`Unsupported source: ${source}`);
			}

			await importDataSource(source, database, host, port, password, user, overwrite, clientGeneratedPrimaryKeys);
		},
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
				await buildBackend();
				await generateTypes();
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
		command: ['build-types'],
		describe: 'Builds your Graphweaver types.',
		handler: async () => {
			await buildBackend();
			await generateTypes();

			// Note, this will leave the ESBuild service process around:
			// https://github.com/evanw/esbuild/issues/985
			// console.log('Handles: ', (process as any)._getActiveHandles());
			//
			// It does not give us a way to kill it gracefully, so we'll do it here.
			process.exit(0);
		},
	})
	// A command that will print the schema either to stdout or to a file
	.command({
		command: ['print-schema'],
		describe: 'Prints the schema to stdout or to a file.',
		builder: (yargs) =>
			yargs.option('output', {
				alias: 'o',
				type: 'string',
				describe: 'Specify the output file.',
			}),
		handler: async ({ output }) => {
			console.log('Printing schema...');
			await buildBackend();
			await printSchema(output);
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
				await startBackend(args as any);
				await generateTypes();
			}
			if (environment === 'frontend' || environment === 'all') {
				await startFrontend(args as StartOptions);
			}
		},
	})
	.command({
		command: ['watch [environment]', 'w [environment]'],
		describe: 'Runs a development version of the project locally and watches files for changes.',
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
				await startBackend(args as any);
			}
			if (environment === 'frontend' || environment === 'all') {
				// Logic to start the process
				console.log('Watch process started...');
				await startFrontend(args as StartOptions);

				const buildDir = path.posix.join(
					'file://',
					process.cwd(),
					`./.graphweaver/backend/index.js`
				);
				const { graphweaver } = await import(buildDir);
				const codegenOptions = graphweaver?.config?.fileAutoGenerationOptions;

				// Watch the directory for file changes
				const watcher = chokidar.watch(
					[
						'./src/**',
						...(codegenOptions?.watchForFileChangesInPaths
							? codegenOptions.watchForFileChangesInPaths.map((filePath: string) =>
									path.join(filePath, '/**')
								)
							: []),
					],
					{
						ignored: [
							/node_modules/,
							/types.generated.ts/,
							/__generated__/,
							/.*\.generated\.tsx$/,
							/.*\.generated\.ts$/,
						],
					}
				);

				// Build Types
				console.log('Generating files...');
				await generateTypes();
				console.log('Generating files complete.\n\n');

				console.log('Waiting for changes... \n\n');

				// Restart the process on file change
				watcher.on('change', async () => {
					console.log('File changed. Rebuilding generated files...');
					await buildBackend();
					await generateTypes();
					console.log('Rebuild complete.\n\n');
					console.log('Waiting for changes... \n\n');
				});
			}
		},
	})
	.command({
		command: ['init-auth [method]', 'auth [method]'],
		describe: 'Initialise Graphweaver with a primary authentication method.',
		builder: (yargs) =>
			yargs
				.positional('method', {
					type: 'string',
					choices: authMethods,
					default: 'password',
					describe: 'The primary authentication method to use.',
				})
				.option('source', {
					type: 'string',
					choices: ['mysql', 'postgresql', 'sqlite'],
					describe: 'Specify the database type.',
				})
				.option('database', {
					type: 'string',
					describe: 'Specify the database name.',
				})
				.option('host', {
					type: 'string',
					describe: 'Specify the database server hostname.',
				})
				.option('port', {
					type: 'number',
					describe: 'Specify the database server port.',
				})
				.option('password', {
					type: 'string',
					describe: 'Specify the database server password.',
				})
				.option('user', {
					type: 'string',
					describe: 'Specify the database server user.',
				}),
		handler: async ({ method, source, database, host, port, password, user }) => {
			if (!authMethods.includes(method as (typeof authMethods)[0])) {
				throw new Error(`Unsupported method: ${method}, please use ${authMethods.join(', ')}`);
			}

			const { import: importOptions } = config();

			if (importOptions) {
				if (source === undefined) source = importOptions.source;
				if (database === undefined) database = importOptions.dbName;
				if (host === undefined) host = importOptions.host;
				if (!port) port = importOptions.port;
				if (user === undefined) user = importOptions.user;
				if (password === undefined) password = importOptions.password;
			}

			if (source && !['mysql', 'postgresql', 'sqlite'].includes(source)) {
				throw new Error(`Invalid source: ${source}`);
			}

			await initAuth({
				method: method as AuthMethod,
				source: source as Source,
				dbName: database,
				host,
				port,
				password,
				user,
			});
		},
	})
	.version(version)
	.showHelpOnFail(true)
	.help('help')
	.command({
		command: '*',
		handler() {
			yargs.showHelp();
		},
	})
	.parse();
