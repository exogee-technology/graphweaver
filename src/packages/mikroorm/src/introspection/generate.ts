import { DatabaseSchema, AbstractSqlPlatform } from '@mikro-orm/knex';
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
	DatabaseFile,
} from './files';
import { pascalToCamelCaseString } from './utils';

const CONNECTION_MANAGER_ID = 'generate';

export class IntrospectionError extends Error {
	protected type: string;
	constructor(
		protected title = '',
		message = ''
	) {
		super(message);
		this.type = 'IntrospectionError';
		this.title = title;
		this.message = message;
	}
}

const hasErrorMessage = (error: any): error is { message: string } => error.message;

const generateBidirectionalRelations = (metadata: EntityMetadata[]) => {
	const nonPrimaryKeyReferenceErrors: string[] = [];

	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		for (const prop of meta.relations) {
			if (!prop.name.includes('Inverse')) {
				const targetMeta = metadata.find((m) => m.className === prop.type);
				const referencedTablePrimaryKeys = Utils.flatten(
					(targetMeta?.getPrimaryProps() ?? []).map((pk) => pk.fieldNames)
				);

				// Check any props that actually have fields in the database to store keys in for references to non-primary keys.
				if (prop.fieldNames?.length) {
					for (const referencedColumn of prop.referencedColumnNames) {
						if (!referencedTablePrimaryKeys.includes(referencedColumn)) {
							nonPrimaryKeyReferenceErrors.push(
								` - Relationship between ${meta.className}.${prop.fieldNames.join(', ')} and ${targetMeta?.className}.${referencedColumn} is not supported.`
							);
						}
					}
				}

				const newProp = {
					name: prop.name + 'Inverse',
					type: meta.className,
					joinColumns: prop.fieldNames,
					referencedTableName: meta.tableName,
					referencedColumnNames: referencedTablePrimaryKeys,
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

	return { errors: nonPrimaryKeyReferenceErrors };
};

const detectManyToManyRelations = (metadata: EntityMetadata[]) => {
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
const normalisePropertyNames = (metadata: EntityMetadata[]): void => {
	for (const meta of metadata.filter((m) => !m.pivotTable)) {
		const props = Object.values(meta.properties);
		props.forEach((prop) => {
			prop.name = pascalToCamelCaseString(prop.name).replace(/\W/g, '_');
		});
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
		.map((table) => table.getEntityDeclaration(namingStrategy, helper, 'never'));

	if (metadata.length === 0) {
		throw new IntrospectionError(
			`Warning: No tables found, this database is empty.`,
			`Make sure you have tables in this database and then try again.`
		);
	}

	normalisePropertyNames(metadata);
	detectManyToManyRelations(metadata);
	generateIdentifiedReferences(metadata);
	const { errors } = generateBidirectionalRelations(metadata);
	generateSingularTypeReferences(metadata);

	return { metadata, errors };
};

const openConnection = async (type: DatabaseType, options: ConnectionOptions) => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const module = require(`@mikro-orm/${type}`);
	const PLATFORMS = {
		mssql: 'MsSqlDriver',
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
	| SchemaIndexFile
	| DataEntityIndexFile
	| DataSourceIndexFile
	| DatabaseFile;

export const isEntityWithSinglePrimaryKey = (meta?: EntityMetadata) => {
	if (!meta) return false;
	return meta.primaryKeys.length === 1;
};

export interface APIOptions {
	clientGeneratedPrimaryKeys?: boolean;
}

export const generate = async (databaseType: DatabaseType, options: ConnectionOptions, apiOptions?: APIOptions) => {
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
		const { metadata, errors } = await convertSchemaToMetadata(schema, platform, namingStrategy);

		// Build a lookup for efficient cross-referencing later.
		const entityLookup = new Map<string, EntityMetadata<any>>();
		for (const meta of metadata) {
			entityLookup.set(meta.className, meta);
		}

		const source: File[] = [];

		const summaryOfEntities: { name: string; entityFilePath: string; schemaFilePath: string }[] =
			[];

		for (const meta of metadata) {
			if (!meta.pivotTable && isEntityWithSinglePrimaryKey(meta)) {
				const dataEntityFile = new DataEntityFile(
					meta,
					namingStrategy,
					platform,
					databaseType,
					entityLookup
				);
				const schemaEntityFile = new SchemaEntityFile(
					meta,
					namingStrategy,
					platform,
					databaseType,
					entityLookup,
					apiOptions?.clientGeneratedPrimaryKeys ?? false
				);
				source.push(dataEntityFile, schemaEntityFile);
				summaryOfEntities.push({
					name: meta.className,
					entityFilePath: `${dataEntityFile.getBasePath()}${dataEntityFile.getBaseName()}`,
					schemaFilePath: `${schemaEntityFile.getBasePath()}${schemaEntityFile.getBaseName()}`,
				});
			} else if (meta.primaryKeys.length > 1) {
				errors.push(
					`Entity ${meta.className} has either more than one primary key. We have skipped it and relations to it because Graphweaver does not support entities with multiple primary keys yet.`
				);
			} else if (meta.primaryKeys.length === 0) {
				errors.push(
					`Entity ${meta.className} has no primary key. We have skipped it and relations to it because Graphweaver does not support entities with no primary key yet.`
				);
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
				errors: 'errors' in file ? file.errors : [],
			};
		});

		await closeConnection();

		console.log('\nImport Summary:');
		console.table(summaryOfEntities);
		console.log(
			`\nImported ${summaryOfEntities.length} entities, creating the above files in your Graphweaver project. \n`
		);

		for (const file of files) {
			errors.push(...file.errors);
		}

		if (errors.length) {
			console.log(`\nWarning ${errors.length} errors detected:\n`);
			console.log(errors.join('\n'));
		}

		return files;
	} catch (err) {
		if (err instanceof IntrospectionError) throw err;

		console.error('Got error during introspection:');
		console.error(err);

		throw new IntrospectionError(
			`Warning: Unable to connect to database.`,
			hasErrorMessage(err) ? err.message : 'Please check the connection settings and try again'
		);
	}
};
