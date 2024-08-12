import { initialiseAuth } from '@exogee/graphweaver-builder';
import { promptForDatabaseOptions } from '../database';

export const initAuth = async ({ method }: { method: 'password' }) => {
	const databaseOptions = await promptForDatabaseOptions({});

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
