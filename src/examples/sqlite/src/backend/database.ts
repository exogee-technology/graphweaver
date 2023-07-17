import { SqliteDriver } from '@mikro-orm/sqlite';

import { Album } from './entities';

export const liteConnection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [Album],
		driver: SqliteDriver,
		dbName: 'database.sqlite',
	},
};

export const connections = [liteConnection];
