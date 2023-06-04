import { MySqlDriver } from '@mikro-orm/mysql';
import { Task, Tag } from './entities';

// Define the database connection
export const myConnection = {
	connectionManagerId: 'my-sql',
	mikroOrmConfig: {
		entities: [Task, Tag],
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: 'root',
		password: 'password',
		port: 3306,
	},
};
