import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Submission } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [Submission],
		driver: PostgreSqlDriver,
		dbName: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
	},
};
