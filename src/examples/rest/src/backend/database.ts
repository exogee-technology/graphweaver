import { MySqlDriver } from '@mikro-orm/mysql';
import { databaseEntities } from './entities';

// Define the database connection
export const myConnection = {
	connectionManagerId: 'my-sql',
	mikroOrmConfig: {
		entities: databaseEntities,
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: process.env.MYSQL_USERNAME,
		password: process.env.MYSQL_PASSWORD,
		port: 3306,
	},
};
