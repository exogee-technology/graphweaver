import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '@exogee/graphweaver-sql-mysql';
import { postgres } from '@exogee/graphweaver-sql-postgres';

export const pgConnection = defineConnection({
	id: 'pg',
	dialect: postgres({
		database: process.env.POSTGRES_DB_NAME ?? 'todo_app',
		host: process.env.POSTGRES_DB_HOST ?? 'localhost',
		port: parseInt(process.env.POSTGRES_DB_PORT ?? '5432'),
		user: process.env.POSTGRES_DB_USER ?? 'postgres',
		password: process.env.POSTGRES_DB_PASSWORD ?? '',
	}),
});

export const myConnection = defineConnection({
	id: 'my',
	dialect: mysql({
		database: process.env.MYSQL_DB_NAME ?? 'todo_app',
		host: process.env.MYSQL_DB_HOST ?? 'localhost',
		port: parseInt(process.env.MYSQL_DB_PORT ?? '3306'),
		user: process.env.MYSQL_DB_USER ?? 'root',
		password: process.env.MYSQL_DB_PASSWORD ?? '',
	}),
});
