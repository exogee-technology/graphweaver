import { MySqlDriver } from '@mikro-orm/mysql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Task, User } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [User],
		driver: PostgreSqlDriver,
		dbName: 'todo_app',
		user: 'postgres',
		password: '',
		port: 5432,
	},
};

export const myConnection = {
	connectionManagerId: 'my',
	mikroOrmConfig: {
		entities: [Task],
		driver: MySqlDriver,
		dbName: 'todo_app',
		user: 'root',
		password: 'password',
		port: 3306,
	},
};
