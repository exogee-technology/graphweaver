import { MySqlDriver } from '@mikro-orm/mysql';
import { Authentication, Credential, ApiKey, Tag, Task } from './entities';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore test to see if it fixes tests
MySqlDriver.prototype.getAutoIncrementIncrement = async () => 1;

// Define the database connection
export const myConnection = {
	connectionManagerId: 'my-sql',
	mikroOrmConfig: {
		entities: [Authentication, Credential, ApiKey, Tag, Task],
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
		port: 3306,
	},
};
