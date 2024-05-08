import { MySqlDriver } from '@mikro-orm/mysql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Task, User } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [User],
		driver: PostgreSqlDriver,
		dbName: process.env.POSTGRES_DB_NAME || 'todo_app',
		user: process.env.POSTGRES_DB_USER || 'postgres',
		password: process.env.POSTGRES_DB_PASSWORD || '',
		port: process.env.POSTGRES_DB_PORT || 5432,
	},
};

export const myConnection = {
	connectionManagerId: 'my',
	mikroOrmConfig: {
		entities: [Task],
		driver: MySqlDriver,
		dbName: process.env.MYSQL_DB_NAME || 'todo_app',
		user: process.env.MYSQL_DB_USER || 'root',
		password: process.env.MYSQL_DB_PASSWORD || '',
		port: process.env.MYSQL_DB_PORT || 3306,
	},
};
