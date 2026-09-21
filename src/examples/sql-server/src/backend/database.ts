import { defineConnection } from '@exogee/graphweaver-sql';
import { mssql } from '@exogee/graphweaver-sql-mssql';

export const connection = defineConnection({
	id: 'mssql',
	dialect: mssql({
		database: process.env.DATABASE_NAME || 'Chinook',
		server: process.env.DATABASE_HOST || '127.0.0.1',
		port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 1433,
		user: process.env.DATABASE_USER || 'sa',
		password: process.env.DATABASE_PASSWORD,
	}),
});

export const connections = [connection];
