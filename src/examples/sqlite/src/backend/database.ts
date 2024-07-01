import { SqliteDriver } from 'mikro-orm-sqlite-wasm';
import { entities, Trace } from './entities';

export const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: entities,
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

export const traceConnection = {
	connectionManagerId: 'sqlite2',
	mikroOrmConfig: {
		entities: [Trace],
		driver: SqliteDriver,
		dbName: 'databases/trace.sqlite',
	},
};
