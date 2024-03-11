import { SqliteDriver } from 'mikro-orm-sqlite-wasm';
import { entities } from './entities';

export const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: entities,
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

export const connections = [connection];
