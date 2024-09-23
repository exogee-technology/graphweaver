import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import esbuild from 'esbuild';
import { DatabaseOptions, Source } from '@exogee/graphweaver-builder';

export const promptForDatabaseOptions = async ({
	source,
	dbName,
	host,
	port,
	password,
	user,
}: Partial<DatabaseOptions>): Promise<DatabaseOptions> => {
	const { default: inquirer } = await import('inquirer');

	if (!source) {
		const prompt = await inquirer.prompt<any, { source: Source }>([
			{
				type: 'list',
				name: 'source',
				message: `What is the data source?`,
				choices: ['mysql', 'postgresql', 'sqlite'],
			},
		]);
		source = prompt.source;
	}

	// They may already have database details in an existing database.ts file.
	// Let's try to import it and see what we can find.
	const databaseFilePath = path.join(process.cwd(), 'src', 'backend', 'database.ts');
	if ((await fs.stat(databaseFilePath)).isFile()) {
		// Ok, now we need to transpile it with esbuild.
		let result;
		try {
			result = await esbuild.transform(await fs.readFile(databaseFilePath, 'utf-8'), {
				format: 'cjs',
				platform: 'node',
				target: 'node18',
			});
		} catch (error) {
			console.error(
				`Existing database.ts file at ${databaseFilePath} could not be transpiled by esbuild.`,
				error
			);
		}

		if (!result) {
			console.error(`No transpilation result returned by esbuild.`);
			console.log(
				'Please provide the database details manually, or kill this process and try again.'
			);
		} else {
			// Note: This does not provide perfect sandboxing. It is possible to escape the sandbox, but if you're writing code on your own machine
			// to break this CLI, then that's great, but we won't really be able to defend you aggressively hosing yourself. This approach provides
			// a way to isolate the code execution from the CLI itself, as long as you're cooperative, which should prevent standard types of errors.
			const sandbox = {
				// Require will not actually work in the sandbox: https://github.com/nodejs/help/issues/761
				// But that's fine, we almost never need it to actually work, we just want it to ignore the imports for this process.
				require: () => ({}),

				// We need to give the file access to env vars so it can use them if it needs to.
				process: { env: process.env },

				// This is mostly so that Typescript knows we intend to access this property and that it's defined.
				module: { exports: {} },
			};
			vm.runInNewContext(result.code, sandbox);

			// What did we get?
			const connections = new Map<string, DatabaseOptions>();
			for (const value of Object.values<{
				connectionManagerId?: string;
				mikroOrmConfig: Partial<DatabaseOptions>;
			}>(sandbox.module.exports)) {
				if (
					typeof value.connectionManagerId === 'string' &&
					typeof value.mikroOrmConfig === 'object'
				) {
					// It's legit.
					connections.set(value.connectionManagerId, value.mikroOrmConfig);
				}
			}

			let connection: DatabaseOptions | undefined;

			if (connections.size > 1) {
				// Which one do you want to use?
				const { connectionId } = await inquirer.prompt<any, { connectionId: string }>([
					{
						type: 'list',
						name: 'connectionId',
						message: `Which database connection would you like to use?`,
						choices: Array.from(connections.keys()),
					},
				]);
				connection = connections.get(connectionId);
			} else if (connections.size === 1) {
				connection = connections.values().next().value;
			}

			if (connection) return { ...connection, source };
		}
	}

	const prompts: any[] = [];

	if (source === 'sqlite') {
		if (!dbName) {
			prompts.push({
				type: 'input',
				name: 'dbName',
				message: `What is the database name?`,
			});
		}
	}

	if (source === 'postgresql' || source === 'mysql') {
		if (!dbName) {
			prompts.push({
				type: 'input',
				name: 'dbName',
				message: `What is the database name?`,
			});
		}
		if (!host) {
			prompts.push({
				type: 'input',
				name: 'host',
				default: '127.0.0.1',
				message: `What is the database server's hostname?`,
			});
		}
		if (!port) {
			prompts.push({
				type: 'input',
				name: 'port',
				default: source === 'postgresql' ? 5432 : 3306,
				message: `What is the port?`,
			});
		}
		if (!user) {
			prompts.push({
				type: 'input',
				name: 'user',
				default: source === 'postgresql' ? 'postgres' : 'root',
				message: `What is the username to access the database server?`,
			});
		}
		if (!password) {
			prompts.push({
				type: 'password',
				mask: '*',
				name: 'password',
				message: `What is the password for this user?`,
			});
		}
	}

	if (prompts.length > 0) {
		const answers = await inquirer.prompt(prompts);
		dbName = answers.dbName ?? dbName;
		host = answers.host ?? host;
		port = answers.port ?? port;
		password = answers.password ?? password;
		user = answers.user ?? user;
	}

	if (!dbName) {
		throw new Error('Database name has not been provided, please provide a database name.');
	}

	return { source, dbName, host, port, password, user };
};
