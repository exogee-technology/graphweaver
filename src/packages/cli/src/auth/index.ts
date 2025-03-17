import { DatabaseOptions, initialiseAuth } from '@exogee/graphweaver-builder';
import { input } from '@inquirer/prompts';
import { promptForDatabaseOptions } from '../database';

export const authMethods = ['password', 'api-key', 'magic-link'] as const;
export type AuthMethod = (typeof authMethods)[number];

interface InitAuthOptions extends Partial<DatabaseOptions> {
	method: AuthMethod;
}

export const initAuth = async ({
	method,
	source,
	dbName,
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
			dbName,
			host,
			port,
			password,
			user,
		});

		tableName = await input({
			message: `Please specify the exact name of the table where you would like the data to be stored:`,
			default: method === 'password' ? 'Credentials' : 'ApiKey',
		});
	}

	await initialiseAuth({ method, tableName, ...databaseOptions });

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};