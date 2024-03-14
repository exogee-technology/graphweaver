import { DatabaseSchema, AbstractSqlPlatform, DatabaseTable } from '@mikro-orm/knex';
import {
	EntityMetadata,
	EntityProperty,
	NamingStrategy,
	ReferenceKind,
	Utils,
} from '@mikro-orm/core';
import pluralize from 'pluralize';

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
import { pascalToCamelCaseString } from './utils';

const CONNECTION_MANAGER_ID = 'generate';

export class IntrospectionError extends Error {
	protected type: string;
	constructor(protected title = '', message = '') {
		super(message);
		this.type = 'IntrospectionError';
		this.title = title;
		this.message = message;
	}
}

const hasErrorMessage = (error: any): error is { message: string } => error.message;

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

				if (prop.kind === ReferenceKind.MANY_TO_ONE) {
					const name = pascalToCamelCaseString(meta.className);
					newProp.name = pluralize(name);
					newProp.kind = ReferenceKind.ONE_TO_MANY;
				} else if (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.mappedBy) {
					newProp.kind = ReferenceKind.ONE_TO_ONE;
					newProp.nullable = true;
				} else if (prop.kind === ReferenceKind.MANY_TO_MANY && !prop.mappedBy) {
					const name = pascalToCamelCaseString(meta.className);
					newProp.name = pluralize(name);
					newProp.kind = ReferenceKind.MANY_TO_MANY;
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
			meta.relations.every((prop) => prop.kind === ReferenceKind.MANY_TO_ONE) // all relations are m:1
		) {
			meta.pivotTable = true;
			const owner = metadata.find((m) => m.className === meta.relations[0].type);
			if (!owner) throw new Error('No Owner');
			const name = pascalToCamelCaseString(meta.relations?.[1]?.type);
			owner.addProperty({
				name: pluralize(name),
				kind: ReferenceKind.MANY_TO_MANY,
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
			if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
				const name = pascalToCamelCaseString(prop.type);
				prop.name = pluralize.singular(name);
				prop.ref = true;
			}
		}
	}
};

const generateSingularTypeReferences = (metadata: EntityMetadata[]): void => {
	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		meta.className = pluralize.singular(meta.className);
		for (const prop of meta.relations) {
			prop.type = pluralize.singular(prop.type);
		}
	}
};

// Convert properties like FirstName to firstName
const convertToCamelCasePropertyNames = (metadata: EntityMetadata[]): void => {
	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		const props = Object.values(meta.properties);
		props.forEach((prop) => {
			prop.name = pascalToCamelCaseString(prop.name);
		});
	}
};

const assertUniqueForeignKeys = (table: DatabaseTable): void => {
	const uniqueForeignKeys = new Set();
	const definedForeignKeys = Object.values(table.getForeignKeys());

	for (const foreignKey of definedForeignKeys) {
		const { localTableName, referencedTableName, columnNames, referencedColumnNames } = foreignKey;
		const serializedValue = JSON.stringify({
			localTableName,
			columnNames: columnNames.sort(),
			referencedTableName,
			referencedColumnNames: referencedColumnNames.sort(),
		});

		if (uniqueForeignKeys.has(serializedValue)) {
			throw new Error(
				`\n\nImport Failed: Duplicate foreign keys detected on column/s (${columnNames.toString()}) in table "${
					table.name
				}".`
			);
		}

		uniqueForeignKeys.add(serializedValue);
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
		.map((table) => {
			assertUniqueForeignKeys(table);
			return table.getEntityDeclaration(namingStrategy, helper, 'never');
		});

	if (metadata.length === 0) {
		throw new IntrospectionError(
			`Warning: No tables found, this database is empty.`,
			`Make sure you have tables in this database and then try again.`
		);
	}

	convertToCamelCasePropertyNames(metadata);
	detectManyToManyRelations(metadata, namingStrategy);
	generateIdentifiedReferences(metadata);
	generateBidirectionalRelations(metadata);
	generateSingularTypeReferences(metadata);

	return metadata;
};

const openConnection = async (type: DatabaseType, options: ConnectionOptions) => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(`@mikro-orm/${type}`);
	const PLATFORMS = {
		mysql: 'MySqlDriver',
		postgresql: 'PostgreSqlDriver',
		sqlite: 'SqliteDriver',
	};
	await ConnectionManager.connect(CONNECTION_MANAGER_ID, {
		mikroOrmConfig: {
			driver: module[PLATFORMS[type]],
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
	try {
		await openConnection(databaseType, options);

		const database = ConnectionManager.database(CONNECTION_MANAGER_ID);
		if (!database)
			throw new IntrospectionError(
				`Warning: Unable to connect to database.`,
				'Please check the connection settings and try again'
			);

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

		const summaryOfEntities: { name: string; entityFilePath: string; schemaFilePath: string }[] =
			[];

		for (const meta of metadata) {
			if (!meta.pivotTable) {
				const dataEntityFile = new DataEntityFile(meta, namingStrategy, platform, databaseType);
				const schemaEntityFile = new SchemaEntityFile(meta, namingStrategy, platform);
				const schemaIndexFile = new SchemaEntityIndexFile(meta, namingStrategy, platform);
				const schemaResolverFile = new SchemaResolverFile(meta, namingStrategy, platform);
				source.push(dataEntityFile, schemaEntityFile, schemaIndexFile, schemaResolverFile);
				summaryOfEntities.push({
					name: meta.className,
					entityFilePath: `${dataEntityFile.getBasePath()}${dataEntityFile.getBaseName()}`,
					schemaFilePath: `${schemaIndexFile.getBasePath()}: ${[
						schemaIndexFile.getBaseName(),
						schemaEntityFile.getBaseName(),
						schemaResolverFile.getBaseName(),
					].join(', ')}`,
				});
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

		const files = source.map((file) => {
			return {
				path: file.getBasePath(),
				name: file.getBaseName(),
				contents: file.generate(),
				needOverwriteWarning: !![DatabaseFile, SchemaIndexFile].some((cls) => file instanceof cls),
			};
		});

		await closeConnection();

		console.log('\nImport Summary:');
		console.table(summaryOfEntities);
		console.log(
			`\nImported ${summaryOfEntities.length} entities, creating the above files in your Graphweaver project. \n`
		);

		return files;
	} catch (err) {
		if (err instanceof IntrospectionError) throw err;

		throw new IntrospectionError(
			`Warning: Unable to connect to database.`,
			hasErrorMessage(err) ? err.message : 'Please check the connection settings and try again'
		);
	}
};
