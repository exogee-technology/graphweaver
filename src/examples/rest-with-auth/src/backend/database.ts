import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '@exogee/graphweaver-sql-mysql';

// @ts-expect-error details of this fix can be found here https://github.com/mikro-orm/mikro-orm/issues/5279
MySqlDriver.prototype.getAutoIncrementIncrement = async () => 1;

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
