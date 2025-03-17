import { DatabaseOptions, Source } from '@exogee/graphweaver-builder';

export const promptForDatabaseOptions = async ({
	source,
	database,
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
				choices: ['mysql', 'postgresql', 'sqlite', 'rest'],
			},
		]);
		source = prompt.source;
	}

	const prompts: any[] = [];

	if (source === 'sqlite') {
		if (typeof database === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'database',
				message: `What is the database name?`,
			});
		}
	}

	if (source === 'rest') {
		if (!database) {
			prompts.push({
				type: 'input',
				name: 'database',
				message: `Where is the Open API spec? (Both file path and URL are supported)`,
			});
		}
	}

	if (source === 'postgresql' || source === 'mysql') {
		if (typeof database === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'database',
				message: `What is the database name?`,
			});
		}
		if (typeof host === 'undefined') {
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
		if (typeof user === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'user',
				default: source === 'postgresql' ? 'postgres' : 'root',
				message: `What is the username to access the database server?`,
			});
		}
		if (typeof password === 'undefined') {
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
		database = answers.database ?? database;
		host = answers.host ?? host;
		port = answers.port ?? port;
		password = answers.password ?? password;
		user = answers.user ?? user;
	}

	if (!database) {
		throw new Error('Database name has not been provided, please provide a database name.');
	}

	return { source, database, host, port, password, user };
};
