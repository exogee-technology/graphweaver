// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file is the only one we need for the bundle
import { argon2id } from 'hash-wasm/dist/argon2.umd.min.js';
import crypto from 'crypto';
import { ConnectionManager, DatabaseType, ConnectionOptions } from '@exogee/graphweaver-mikroorm';
import generatePassword from 'omgopass';

import { DatabaseOptions } from './index';

const generateSalt = (): Uint8Array => {
	const salt = new Uint8Array(16);
	// Fill the salt array with cryptographically secure random numbers.
	return crypto.getRandomValues(salt);
};

const argon2IdOptions = {
	salt: generateSalt(),
	parallelism: 4,
	iterations: 3,
	memorySize: 65536,
	hashLength: 32,
	outputType: 'encoded',
};

const openConnection = async (type: DatabaseType, options: ConnectionOptions) => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(`@mikro-orm/${type}`);
	const PLATFORMS = {
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

const closeConnection = async () => {
	console.log('Closing database connection...');
	await ConnectionManager.close('default');
	console.log('Database connection closed.');
};

interface GenerateAdminPasswordOptions extends DatabaseOptions {
	tableName: string;
}

export const generateAdminPassword = async (options: GenerateAdminPasswordOptions) => {
	await openConnection(options.source, {
		mikroOrmConfig: {
			host: options.host,
			port: options.port,
			user: options.user,
			password: options.password,
			dbName: options.database,
		},
	});

	const database = ConnectionManager.database('default');
	if (!database)
		throw new Error(
			`Warning: Unable to connect to database. Please check the connection settings and try again`
		);

	const pwd = generatePassword();
	const hash = argon2id({
		password: pwd,
		...argon2IdOptions,
	});
	const pwdString = `****** Admin Password: ${pwd} ******`;

	const knex = database.em.getConnection().getKnex();
	await knex(options.tableName).insert({
		username: 'admin',
		password: hash,
	});
	await closeConnection();

	const paddingLineString = '*'.repeat(pwdString.length);
	console.log(`\n\n${paddingLineString}`);
	console.log(pwdString);
	console.log(`${paddingLineString}\n`);
};
