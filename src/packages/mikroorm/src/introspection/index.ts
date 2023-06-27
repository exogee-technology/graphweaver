import { knex, Column } from '@mikro-orm/knex';
import schemaInspector from 'knex-schema-inspector';

type DBConnection = {
	host: string;
	user: string;
	password: string;
	database: string;
};

type TableMetadata = {
	[k in string]: Column[];
};

const fetchDatabaseMetadata = async (client: 'postgresql' | 'mysql', connection: DBConnection) => {
	const database = knex({
		client,
		connection: {
			...connection,
			charset: 'utf8',
		},
	});
	const inspector = schemaInspector(database);
	const columns = await inspector.columnInfo();

	const entities: TableMetadata = columns.reduce((metadata: TableMetadata, column) => {
		return {
			...metadata,
			[column.table]: [...(metadata[column.table] ? metadata[column.table] : []), column],
		} as TableMetadata;
	}, {});

	await database.destroy();

	return entities;
};

export const introspection = async () => {
	console.log('introspecting...');
	const metadata = await fetchDatabaseMetadata('postgresql', {
		host: '127.0.0.1',
		user: 'postgres',
		password: '',
		database: 'go-collect',
	});

	console.log(metadata);
};

//1. Generate Mikro Data Entities
//2. Convert to GW Data Entities
//3. Transcribe GW GraphQL entity from GW Data Entity
