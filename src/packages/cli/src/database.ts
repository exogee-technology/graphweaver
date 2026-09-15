import { DatabaseOptions, DatabaseSslOptions, Source } from '@exogee/graphweaver-builder';

export interface SslFlags {
	ssl?: boolean;
	sslCa?: string;
	sslCert?: string;
	sslKey?: string;
	sslRejectUnauthorized?: boolean;
}

/**
 * Collapses the --ssl* command line flags into the single options object the rest of the import
 * works with. Returns undefined when the developer didn't ask for anything, so we know to fall
 * back to the config file or to ask them.
 */
export const sslOptionsFromFlags = ({
	ssl,
	sslCa,
	sslCert,
	sslKey,
	sslRejectUnauthorized,
}: SslFlags) => {
	const options: DatabaseSslOptions = {};
	if (sslCa) options.ca = sslCa;
	if (sslCert) options.cert = sslCert;
	if (sslKey) options.key = sslKey;
	if (typeof sslRejectUnauthorized === 'boolean') {
		options.rejectUnauthorized = sslRejectUnauthorized;
	}

	// Passing any of the options above only makes sense with SSL on, so we don't make people
	// pass --ssl as well.
	if (Object.keys(options).length > 0) return options;

	return ssl;
};

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
	ssl,
}: Partial<DatabaseOptions>): Promise<DatabaseOptions> => {
	const { default: inquirer } = await import('inquirer');

	if (!source) {
		const prompt = await inquirer.prompt<{ source: Source }>([
			{
				type: 'select',
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

	// If everything we need was passed in on the command line we're being driven by a script, so
	// we shouldn't start asking questions it can't answer.
	const isInteractive = prompts.length > 0;

	if (isInteractive) {
		const answers = await inquirer.prompt(prompts);
		dbName = answers.dbName ?? dbName;
		host = answers.host ?? host;
		port = answers.port ?? port;
		password = answers.password ?? password;
		user = answers.user ?? user;
	}

	if (isInteractive && source !== 'sqlite' && typeof ssl === 'undefined') {
		const { useSsl } = await inquirer.prompt<{ useSsl: boolean }>([
			{
				type: 'confirm',
				name: 'useSsl',
				default: false,
				message: `Does this database require an SSL connection?`,
			},
		]);

		if (useSsl) {
			const { ca } = await inquirer.prompt<{ ca: string }>([
				{
					type: 'input',
					name: 'ca',
					message: `Path to the CA certificate to trust (leave blank to use the system certificate authorities):`,
				},
			]);

			ssl = ca ? { ca } : true;
		} else {
			ssl = false;
		}
	}

	if (!dbName) {
		throw new Error('Database name has not been provided, please provide a database name.');
	}

	return { source, dbName, host, port, password, user, ssl };
};
