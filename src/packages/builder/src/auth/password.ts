import { hashPassword } from '@exogee/graphweaver-auth';
import { ConnectionManager, DatabaseType, ConnectionOptions } from '@exogee/graphweaver-mikroorm';
import generatePassword from 'omgopass';

import { DatabaseOptions } from './index';

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
	const hash = await hashPassword(pwd);
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
