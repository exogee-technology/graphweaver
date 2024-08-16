import { DatabaseOptions, initialiseAuth } from '@exogee/graphweaver-builder';
import { promptForDatabaseOptions } from '../database';

export const authMethods = ['password', 'api-key', 'magic-link'];
export type AuthMethod = 'password' | 'api-key' | 'magic-link';

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

	let tableName = '';
	if (!['password', 'api-key'].includes(method)) {
		const prompt = await inquirer.prompt<any, { tableName: string }>([
			{
				type: 'input',
				name: 'tableName',
				default: method === 'password' ? 'Credentials' : 'ApiKey',
				message: `Please specify the exact name of the table where you would like the data to be stored:`,
			},
		]);
		tableName = prompt.tableName;
	}

	await initialiseAuth({ method, tableName, ...databaseOptions });

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
