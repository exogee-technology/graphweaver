import fs from 'fs';
import path from 'path';
import { config } from './config';

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
			path.join(process.cwd(), 'databases', 'database.sqlite'),
			path.join(process.cwd(), config.appDirectory, 'databases', 'database.sqlite')
		);
		return;
	}
};
