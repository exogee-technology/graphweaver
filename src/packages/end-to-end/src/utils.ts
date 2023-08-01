import fs from 'fs';
import { config } from './config';
import { seedData, dropDataAndRecreateGWDatabase, deleteDatabase } from './postgres-utils';

const database = process.env.DATABASE;

export enum Database {
	SQLITE = 'sqlite',
	POSTGRES = 'postgres',
	MYSQL = 'mysql',
}

export const resetDatabase = async () => {
	if (!database) {
		throw new Error('Please specify a database to use');
	}
	if (database === Database.SQLITE) {
		fs.copyFileSync(
			'./databases/database.sqlite',
			`${config.appDirectory}/databases/database.sqlite`
		);
		return;
	}
	if (database === Database.POSTGRES) {
		await dropDataAndRecreateGWDatabase();
		await seedData();
	} else {
		throw new Error(`Database ${database} not supported.`);
	}
};
