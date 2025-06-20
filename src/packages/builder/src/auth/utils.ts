import crypto from 'crypto';
import { ConnectionManager, DatabaseType, ConnectionOptions } from '@exogee/graphweaver-mikroorm';

export const generateSalt = (): Uint8Array => {
	const salt = new Uint8Array(16);
	// Fill the salt array with cryptographically secure random numbers.
	return crypto.getRandomValues(salt);
};

export const argon2IdOptions = {
	salt: generateSalt(),
	parallelism: 4,
	iterations: 3,
	memorySize: 65536,
	hashLength: 32,
	outputType: 'encoded',
};

export const openConnection = async (type: DatabaseType, options: ConnectionOptions) => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const module = require(`@mikro-orm/${type}`);
	const PLATFORMS = {
		mssql: 'MsSqlDriver',
		mysql: 'MySqlDriver',
		postgresql: 'PostgreSqlDriver',
		sqlite: 'SqliteDriver',
	};
	await ConnectionManager.connect('default', {
		mikroOrmConfig: {
			driver: module[PLATFORMS[type]],
			...options.mikroOrmConfig,
		},
	});
};

export const closeConnection = async () => {
	console.log('Closing database connection...');
	await ConnectionManager.close('default');
	console.log('Database connection closed.');
};
