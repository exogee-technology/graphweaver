import { Response } from '@playwright/test';
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
	if (database === Database.POSTGRES) {
		const { Client } = await import('pg');
		const client = new Client({
			host: process.env.DATABASE_HOST || 'localhost',
			port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
			user: process.env.DATABASE_USERNAME || 'postgres',
			password: process.env.DATABASE_PASSWORD || 'postgres',
			database: process.env.DATABASE_NAME || 'gw',
		});

		await client.connect();
		const sql = fs.readFileSync(path.join(process.cwd(), 'databases', 'postgres.sql')).toString();
		await client.query('DROP SCHEMA public CASCADE');
		await client.query('CREATE SCHEMA public');
		await client.query(sql);
		await client.end();
		return;
	}
	if (database === Database.MYSQL) {
		const mysql = await import('mysql2/promise');
		const connection = await mysql.createConnection({
			host: process.env.DATABASE_HOST || 'localhost',
			port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
			user: process.env.DATABASE_USERNAME || 'mysql',
			password: process.env.DATABASE_PASSWORD || 'mysql',
			multipleStatements: true,
		});

		const sql = fs.readFileSync(path.join(process.cwd(), 'databases', 'mysql.sql')).toString();
		await connection.query(sql);
		await connection.end();
		return;
	}
};

export function bodyHasText(searchText: string | RegExp) {
	return async (response: Response) => (await response.body()).toString().match(searchText) !== null;
}
