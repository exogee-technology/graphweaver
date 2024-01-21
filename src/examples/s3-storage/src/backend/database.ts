import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Submission } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [Submission],
		driver: PostgreSqlDriver,
		dbName: 'gw-storage-provider',
		user: 'postgres',
		password: '',
		port: 5432,
	},
};
