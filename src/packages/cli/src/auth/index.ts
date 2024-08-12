import { DatabaseOptions, initialiseAuth } from '@exogee/graphweaver-builder';
import { promptForDatabaseOptions } from '../database';

interface InitAuthOptions extends Partial<DatabaseOptions> {
	method: 'password';
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
			message: `Please specify the exact name of the table where you would like the credentials to be stored:`,
		},
	]);

	await initialiseAuth({ method, tableName: prompt.tableName, ...databaseOptions });
};
