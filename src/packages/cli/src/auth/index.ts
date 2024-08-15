import { DatabaseOptions, initialiseAuth } from '@exogee/graphweaver-builder';
import { promptForDatabaseOptions } from '../database';

export type AuthMethod = 'password' | 'api-key';

interface InitAuthOptions extends Partial<DatabaseOptions> {
	method: AuthMethod;
}

export const initAuth = async ({
	method,
	source,
	database,
	host,
	port,
	password,
	user,
}: InitAuthOptions) => {
	if (source && !['mysql', 'postgresql', 'sqlite'].includes(source)) {
		throw new Error(`Invalid source: ${source}`);
	}

	const databaseOptions = await promptForDatabaseOptions({
		source,
		database,
		host,
		port,
		password,
		user,
	});

	const { default: inquirer } = await import('inquirer');
	const prompt = await inquirer.prompt<any, { tableName: string }>([
		{
			type: 'input',
			name: 'tableName',
			default: method === 'password' ? 'Credentials' : 'ApiKey',
			message: `Please specify the exact name of the table where you would like the data to be stored:`,
		},
	]);

	await initialiseAuth({ method, tableName: prompt.tableName, ...databaseOptions });

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
