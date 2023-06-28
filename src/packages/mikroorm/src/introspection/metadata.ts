import { DatabaseSchema } from '@mikro-orm/knex';

import { ConnectionManager, ConnectionOptions } from '../database';

const getSchema = async () => {
	const database = ConnectionManager.database('gen');
	if (!database) throw new Error('cannot connect to database');
	const config = database.em.config;
	const driver = database.em.getDriver();
	const platform = driver.getPlatform();
	const connection = driver.getConnection();

	return await DatabaseSchema.create(connection, platform, config);
};

const convertSchemaToMetadata = async (schema: DatabaseSchema) => {
	const database = ConnectionManager.database('gen');
	if (!database) throw new Error('cannot connect to database');
	const config = database.em.config;
	const driver = database.em.getDriver();
	const platform = driver.getPlatform();
	const helper = platform.getSchemaHelper();
	const namingStrategy = config.getNamingStrategy();

	if (!helper) throw new Error('cannot connect to database');

	return schema
		.getTables()
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((table) => table.getEntityDeclaration(namingStrategy, helper));
};

const openConnection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	const { PostgreSqlDriver } = await import('@mikro-orm/postgresql');

	await ConnectionManager.connect('gen', {
		mikroOrmConfig: {
			driver: PostgreSqlDriver,
			...options.mikroOrmConfig,
		},
	});
};

const closeConnection = async () => {
	console.log('Closing database connection...');
	await ConnectionManager.close('gen');
	console.log('Database connection closed.');
};

export const getMetadata = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	await openConnection(client, options);
	const schema = await getSchema();
	const metadata = await convertSchemaToMetadata(schema);
	await closeConnection();
	return metadata;
};
