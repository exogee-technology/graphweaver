// @ts-expect-error This file is the only one we need for the bundle
import { argon2id } from 'hash-wasm/dist/argon2.umd.min.js';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import crypto from 'crypto';

import { DatabaseOptions } from './index';
import { argon2IdOptions, closeConnection, openConnection } from './utils';

interface GenerateApiKeyOptions extends DatabaseOptions {
	tableName: string;
}

const generateKeyAndSecret = async () => {
	// Generate secret

	const secretKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
		'encrypt',
	]);
	const { k: secretValue } = await crypto.subtle.exportKey('jwk', secretKey);

	const generatedKey = crypto.randomUUID();

	return { key: generatedKey, secret: secretValue };
};

export const generateApiKey = async (options: GenerateApiKeyOptions) => {
	if (!options.source) {
		throw new Error('No source specified, please specify a data source.');
	}

	await openConnection(options.source, {
		mikroOrmConfig: {
			host: options.host,
			port: options.port,
			user: options.user,
			password: options.password,
			dbName: options.dbName,
		},
	});

	const database = ConnectionManager.database('default');
	if (!database)
		throw new Error(
			`Warning: Unable to connect to database. Please check the connection settings and try again`
		);

	const { key, secret } = await generateKeyAndSecret();
	const hash = await argon2id({
		password: secret,
		...argon2IdOptions,
	});
	const base64ApiKey = Buffer.from(`${key}:${secret}`).toString('base64');
	const keyString = `**** API Key: ${base64ApiKey} ****`;

	const knex = database.em.getConnection().getKnex();
	await knex(options.tableName).insert({
		api_key: key,
		secret: hash,
		roles: 'ApiKeyUsers',
	});
	await closeConnection();

	const paddingLineString = '*'.repeat(keyString.length);
	console.log(`\n\n${paddingLineString}`);
	console.log(keyString);
	console.log(`${paddingLineString}\n`);
};
