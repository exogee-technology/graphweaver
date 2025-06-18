import { DatabaseOptions, Source } from '@exogee/graphweaver-builder';

const defaultUserForSource = (source: Source) => {
	if (source === 'mssql') return 'sa';
	if (source === 'mysql') return 'root';
	if (source === 'postgresql') return 'postgres';

	return 'root';
};

const defaultPortForSource = (source: Source) => {
	if (source === 'mssql') return 1433;
	if (source === 'mysql') return 3306;
	if (source === 'postgresql') return 5432;

	return 3306;
};

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
				choices: ['mssql', 'mysql', 'postgresql', 'sqlite'],
			},
		]);
		source = prompt.source;
	}

	const prompts: any[] = [];

	if (source === 'sqlite') {
		if (typeof dbName === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'dbName',
				message: `What is the database name?`,
			});
		}
	}

	if (source === 'postgresql' || source === 'mssql' || source === 'mysql') {
		if (typeof dbName === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'dbName',
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
				default: defaultPortForSource(source),
				message: `What is the port?`,
			});
		}
		if (typeof user === 'undefined') {
			prompts.push({
				type: 'input',
				name: 'user',
				default: defaultUserForSource(source),
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
