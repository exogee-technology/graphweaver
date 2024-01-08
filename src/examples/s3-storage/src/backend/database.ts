import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Submission, User } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [User, Submission],
		driver: PostgreSqlDriver,
		dbName: 'gw-storage-provider',
		user: 'postgres',
		password: '',
		port: 5432,
	},
};
