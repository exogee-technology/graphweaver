import { Response } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const database = process.env.DATABASE;

export enum Database {
	SQLITE = 'sqlite',
	POSTGRES = 'postgres',
	MYSQL = 'mysql',
	MSSQL = 'mssql',
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
			port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT) : 5432,
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
			port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT) : 3306,
			user: process.env.DATABASE_USERNAME || 'root',
			password: process.env.DATABASE_PASSWORD || 'root',
			multipleStatements: true,
		});

		const sql = fs.readFileSync(path.join(process.cwd(), 'databases', 'mysql.sql')).toString();

		// mysql2 runs each statement in its own autocommit transaction, so the ~15.6k INSERTs in
		// this file cost us ~15.6k commits (about 12.5s in CI, against a 30s hook timeout). The
		// equivalent Postgres file takes 0.65s because node-postgres sends it as one implicit
		// transaction, so do the same here. The DDL at the top of the file implicitly commits,
		// which is fine; it's the INSERTs that need to land in a single transaction.
		await connection.query(`SET autocommit = 0;\n${sql}\nCOMMIT;`);
		await connection.end();
		return;
	}
	if (database === Database.MSSQL) {
		// `mssql` is CommonJS, and cjs-module-lexer does not find `connect` on it -- so the named
		// import is undefined and only the default has the module on it.
		const mssql = await import('mssql');
		const connect = mssql.connect ?? mssql.default.connect;
		const pool = await connect({
			server: process.env.DATABASE_HOST || 'localhost',
			port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT) : 1433,
			user: process.env.DATABASE_USERNAME || 'sa',
			password: process.env.DATABASE_PASSWORD || 'Graphweaver1!',
			// Not Chinook: the script's first act is to drop that database, which SQL Server
			// refuses while this connection is sitting in it. The script selects it itself.
			database: 'master',
			options: { encrypt: false, trustServerCertificate: true },
			// One connection, deliberately. `USE [Chinook]` is connection scoped, so a pool would
			// run the batches after it against master and create every table in the wrong place.
			pool: { min: 1, max: 1 },
		});

		const sql = fs.readFileSync(path.join(process.cwd(), 'databases', 'mssql.sql')).toString();

		// The Chinook SQL Server script is batched with GO separators, which are a SQLCMD
		// construct rather than T-SQL, so the driver never sees them. Split and run each batch.
		for (const batch of sql.split(/^[^\S\r\n]*GO[^\S\r\n]*$/gim)) {
			if (batch.trim()) await pool.request().batch(batch);
		}

		await pool.close();
		return;
	}
};

export function bodyHasText(searchText: string | RegExp) {
	return async (response: Response) =>
		(await response.body()).toString().match(searchText) !== null;
}
