import { DatabaseSchema, AbstractSqlPlatform } from '@mikro-orm/knex';
import {
	EntityMetadata,
	EntityProperty,
	NamingStrategy,
	ReferenceType,
	Utils,
} from '@mikro-orm/core';

import { ConnectionManager, ConnectionOptions, DatabaseType } from '../database';
import {
	DataEntityFile,
	DataEntityIndexFile,
	DataSourceIndexFile,
	SchemaEntityFile,
	SchemaIndexFile,
	SchemaResolverFile,
	SchemaEntityIndexFile,
	DatabaseFile,
} from './files';

const CONNECTION_MANAGER_ID = 'generate';

const generateBidirectionalRelations = (metadata: EntityMetadata[]): void => {
	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		for (const prop of meta.relations) {
			if (!prop.name.includes('Inverse')) {
				const targetMeta = metadata.find((m) => m.className === prop.type);
				const newProp = {
					name: prop.name + 'Inverse',
					type: meta.className,
					joinColumns: prop.fieldNames,
					referencedTableName: meta.tableName,
					referencedColumnNames: Utils.flatten(
						(targetMeta?.getPrimaryProps() ?? []).map((pk) => pk.fieldNames)
					),
					mappedBy: prop.name,
				} as EntityProperty;

				// Add reference to the inverse entity
				const inverseMeta = metadata.find((m) => m.className === meta.className);
				const inverseProp = inverseMeta?.props.find((p) => p.name === newProp.mappedBy);
				if (inverseProp) inverseProp.inversedBy = newProp.name;

				if (prop.reference === ReferenceType.MANY_TO_ONE) {
					newProp.reference = ReferenceType.ONE_TO_MANY;
				} else if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.mappedBy) {
					newProp.reference = ReferenceType.ONE_TO_ONE;
					newProp.nullable = true;
				} else if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.mappedBy) {
					newProp.reference = ReferenceType.MANY_TO_MANY;
				} else {
					continue;
				}

				targetMeta?.addProperty(newProp);
			}
		}
	}
};

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

const generateIdentifiedReferences = (metadata: EntityMetadata[]): void => {
	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		for (const prop of meta.relations) {
			if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
				prop.wrappedReference = true;
			}
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
	generateIdentifiedReferences(metadata);
	generateBidirectionalRelations(metadata);

	return metadata;
};

const openConnection = async (type: DatabaseType, options: ConnectionOptions) => {
	await ConnectionManager.connect(CONNECTION_MANAGER_ID, {
		mikroOrmConfig: {
			type,
			...options.mikroOrmConfig,
		},
	});
};

const closeConnection = async () => {
	console.log('Closing database connection...');
	await ConnectionManager.close(CONNECTION_MANAGER_ID);
	console.log('Database connection closed.');
};

type File =
	| DataEntityFile
	| SchemaEntityFile
	| SchemaEntityIndexFile
	| SchemaIndexFile
	| SchemaResolverFile
	| DataEntityIndexFile
	| DataSourceIndexFile
	| DatabaseFile;

export const generate = async (databaseType: DatabaseType, options: ConnectionOptions) => {
	await openConnection(databaseType, options);

	const database = ConnectionManager.database(CONNECTION_MANAGER_ID);
	if (!database) throw new Error('cannot connect to database');

	const config = database.em.config;
	const driver = database.em.getDriver();
	const platform = driver.getPlatform();
	const namingStrategy = config.getNamingStrategy();
	const connection = driver.getConnection();

	console.log('Fetching database schema...');
	const schema = await DatabaseSchema.create(connection, platform, config);
	console.log('Building metadata...');
	const metadata = await convertSchemaToMetadata(schema, platform, namingStrategy);

	const source: File[] = [];

	for (const meta of metadata) {
		if (!meta.pivotTable) {
			source.push(new DataEntityFile(meta, namingStrategy, platform, databaseType));
			source.push(new SchemaEntityFile(meta, namingStrategy, platform));
			source.push(new SchemaEntityIndexFile(meta, namingStrategy, platform));
			source.push(new SchemaResolverFile(meta, namingStrategy, platform));
		}
	}

	// Export all the entities from the data source directory
	source.push(new DataEntityIndexFile(metadata, databaseType));
	// Export the data source from the entities directory
	source.push(new DataSourceIndexFile(databaseType));
	// Export the data source from the entities directory
	source.push(new SchemaIndexFile(metadata));
	// Export the database connection to its own file
	source.push(new DatabaseFile(databaseType, options));

	const files = source.map((file) => ({
		path: file.getBasePath(),
		name: file.getBaseName(),
		contents: file.generate(),
	}));

	await closeConnection();

	return files;
};
