import { DatabaseSchema, AbstractSqlPlatform } from '@mikro-orm/knex';
import { EntityMetadata, EntityProperty, NamingStrategy, ReferenceType } from '@mikro-orm/core';

import { ConnectionManager, ConnectionOptions } from '../database';
import { DataEntityFile, GraphQlEntityFile } from './files';

const CONNECTION_MANAGER_ID = 'generate';

const detectManyToManyRelations = (metadata: EntityMetadata[], namingStrategy: NamingStrategy) => {
	for (const meta of metadata) {
		if (
			meta.compositePK && // needs to have composite PK
			meta.primaryKeys.length === meta.relations.length && // all relations are PKs
			meta.relations.length === 2 && // there are exactly two relation properties
			meta.relations.length === meta.props.length && // all properties are relations
			meta.relations.every((prop) => prop.reference === ReferenceType.MANY_TO_ONE) // all relations are m:1
		) {
			meta.pivotTable = true;
			const owner = metadata.find((m) => m.className === meta.relations[0].type);
			if (!owner) throw new Error('No Owner');
			const name = namingStrategy.columnNameToProperty(
				meta.tableName.replace(new RegExp('^' + owner.tableName + '_'), '')
			);
			owner.addProperty({
				name,
				reference: ReferenceType.MANY_TO_MANY,
				pivotTable: meta.tableName,
				type: meta.relations[1].type,
				joinColumns: meta.relations[0].fieldNames,
				inverseJoinColumns: meta.relations[1].fieldNames,
			} as EntityProperty);
		}
	}
};

const convertSchemaToMetadata = async (
	schema: DatabaseSchema,
	platform: AbstractSqlPlatform,
	namingStrategy: NamingStrategy
) => {
	const helper = platform.getSchemaHelper();

	if (!helper) throw new Error('cannot connect to database');

	const metadata = schema
		.getTables()
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((table) => table.getEntityDeclaration(namingStrategy, helper));

	detectManyToManyRelations(metadata, namingStrategy);

	return metadata;
};

const openConnection = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	const { PostgreSqlDriver } = await import('@mikro-orm/postgresql');

	await ConnectionManager.connect(CONNECTION_MANAGER_ID, {
		mikroOrmConfig: {
			driver: PostgreSqlDriver,
			...options.mikroOrmConfig,
		},
	});
};

const closeConnection = async () => {
	console.log('Closing database connection...');
	await ConnectionManager.close(CONNECTION_MANAGER_ID);
	console.log('Database connection closed.');
};

export const generate = async (client: 'postgresql' | 'mysql', options: ConnectionOptions) => {
	await openConnection(client, options);

	const database = ConnectionManager.database(CONNECTION_MANAGER_ID);
	if (!database) throw new Error('cannot connect to database');

	const config = database.em.config;
	const driver = database.em.getDriver();
	const platform = driver.getPlatform();
	const namingStrategy = config.getNamingStrategy();
	const connection = driver.getConnection();

	const schema = await DatabaseSchema.create(connection, platform, config);
	const metadata = await convertSchemaToMetadata(schema, platform, namingStrategy);

	const source: (DataEntityFile | GraphQlEntityFile)[] = [];

	for (const meta of metadata) {
		if (!meta.pivotTable) {
			source.push(new DataEntityFile(meta, namingStrategy, platform));
			source.push(new GraphQlEntityFile(meta, namingStrategy, platform));
		}
	}

	const files = source.map((file) => ({
		filepath: `${file.getBasePath()}${file.getBaseName()}`,
		contents: file.generate(),
	}));

	await closeConnection();

	return files;
};
