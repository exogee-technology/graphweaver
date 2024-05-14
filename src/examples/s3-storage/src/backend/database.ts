import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Submission } from './entities';

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [Submission],
		driver: PostgreSqlDriver,
		dbName: process.env.PGDATABASE,
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 3306,
	},
};
