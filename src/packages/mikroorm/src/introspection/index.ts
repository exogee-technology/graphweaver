import { knex } from '@mikro-orm/knex';
import schemaInspector from 'knex-schema-inspector';

export const introspection = async () => {
	console.log('introspecting...');

	const database = knex({
		client: 'postgresql',
		connection: {
			host: '127.0.0.1',
			user: 'postgres',
			password: '',
			database: 'todo_app',
			charset: 'utf8',
		},
	});
	const inspector = schemaInspector(database);

	console.log(await inspector.tables());
	await database.destroy();
};

//1. Generate Mikro Data Entities
//2. Convert to GW Data Entities
//3. Transcribe GW GraphQL entity from GW Data Entity
