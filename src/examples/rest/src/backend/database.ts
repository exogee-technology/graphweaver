import { MySqlDriver } from '@mikro-orm/mysql';
import { Authentication, Credential, Tag, Task } from './entities';

// Define the database connection
export const myConnection = {
	connectionManagerId: 'my-sql',
	mikroOrmConfig: {
		entities: [Authentication, Credential, Tag, Task],
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
		port: 3306,
	},
};
