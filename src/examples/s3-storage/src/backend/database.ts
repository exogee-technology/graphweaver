import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { User } from './entities';

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
