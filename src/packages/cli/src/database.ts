import { DatabaseOptions, Source } from '@exogee/graphweaver-builder';
import { select, input, password } from '@inquirer/prompts';

export const promptForDatabaseOptions = async ({
	source,
	database,
	host,
	port,
	password: passwordValue,
	user,
}: Partial<DatabaseOptions>): Promise<DatabaseOptions> => {
	if (!source) {
		source = await select<Source>({
			message: `What is the data source?`,
			choices: [
				{ value: 'mysql', name: 'mysql' },
				{ value: 'postgresql', name: 'postgresql' },
				{ value: 'sqlite', name: 'sqlite' },
				{ value: 'rest', name: 'rest' },
			],
		});
	}

	if (source === 'sqlite' && typeof database === 'undefined') {
		database = await input({
			message: `What is the database name?`,
		});
	}

	if (source === 'rest' && !database) {
		database = (
			await input({
				message: `Where is the Open API spec? (Both file path and URL are supported)`,
			})
		)?.trim();
	}

	if (source === 'postgresql' || source === 'mysql') {
		if (typeof database === 'undefined') {
			database = await input({
				message: `What is the database name?`,
			});
		}

		if (typeof host === 'undefined') {
			host = await input({
				message: `What is the database server's hostname?`,
				default: '127.0.0.1',
			});
		}

		if (!port) {
			port = Number(
				await input({
					message: `What is the port?`,
					default: source === 'postgresql' ? '5432' : '3306',
				})
			);
		}

		if (typeof user === 'undefined') {
			user = await input({
				message: `What is the username to access the database server?`,
				default: source === 'postgresql' ? 'postgres' : 'root',
			});
		}

		if (typeof passwordValue === 'undefined') {
			passwordValue = await password({
				message: `What is the password for this user?`,
				mask: '*',
			});
		}
	}

	if (!database) {
		throw new Error('Database name has not been provided, please provide a database name.');
	}

	return {
		source,
		database,
		host,
		port,
		password: passwordValue,
		user,
	};
};
