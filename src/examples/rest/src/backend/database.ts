import { MySqlDriver } from '@mikro-orm/mysql';
import { Credential, Task, Tag, MagicLink } from './entities';

// Define the database connection
export const myConnection = {
	connectionManagerId: 'my-sql',
	mikroOrmConfig: {
		entities: [Credential, MagicLink, Task, Tag],
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: process.env.MYSQL_USERNAME,
		password: process.env.MYSQL_PASSWORD,
		port: 3306,
	},
};
