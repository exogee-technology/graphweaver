// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file is the only one we need for the bundle
import { argon2id } from 'hash-wasm/dist/argon2.umd.min.js';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import generatePassword from 'omgopass';

import { DatabaseOptions } from './index';
import { argon2IdOptions, closeConnection, openConnection } from './utils';

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
	const hash = await argon2id({
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
