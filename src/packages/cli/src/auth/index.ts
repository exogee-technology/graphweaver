import { DatabaseOptions, initialiseAuth } from '@exogee/graphweaver-builder';
import { promptForDatabaseOptions } from '../database';

export const authMethods = ['password', 'api-key', 'magic-link'] as const;
export type AuthMethod = (typeof authMethods)[number];

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
	let tableName = '';
	let databaseOptions = {};
	if (['password', 'api-key'].includes(method)) {
		if (source && !['mysql', 'postgresql', 'sqlite'].includes(source)) {
			throw new Error(`Invalid source: ${source}`);
		}
		databaseOptions = await promptForDatabaseOptions({
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
		tableName = prompt.tableName;
	}

	await initialiseAuth({ method, tableName, ...databaseOptions });

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
