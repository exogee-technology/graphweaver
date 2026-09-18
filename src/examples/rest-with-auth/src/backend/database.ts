import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '@exogee/graphweaver-sql-mysql';

// Define the database connection
export const myConnection = defineConnection({
	id: 'my-sql',
	dialect: mysql({
		database: 'todo_app',
		port: 3306,
		user: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
	}),
});
