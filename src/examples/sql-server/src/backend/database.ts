import { MsSqlDriver } from '@mikro-orm/mssql';
import { entities } from './entities';

export const connection = {
	connectionManagerId: 'mssql',
	mikroOrmConfig: {
		entities,
		driver: MsSqlDriver,
		dbName: process.env.DATABASE_NAME || 'Chinook',
		host: process.env.DATABASE_HOST || '127.0.0.1',
		user: process.env.DATABASE_USER || 'sa',
		password: process.env.DATABASE_PASSWORD,
		port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 1433,
	},
};

export const connections = [connection];
