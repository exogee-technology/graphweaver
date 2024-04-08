import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLEnumValueConfigMap,
	GraphQLFieldConfig,
	GraphQLFloat,
	GraphQLInputFieldConfig,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLOutputType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	isScalarType,
	printSchema,
	ThunkObjMap,
} from 'graphql';
import { ObjMap } from 'graphql/jsutils/ObjMap';
import { logger } from '@exogee/logger';

import {
	AuthChecker,
	EntityMetadata,
	EnumMetadata,
	graphweaverMetadata,
	isEntityMetadata,
	isEnumMetadata,
	TypeValue,
	Sort,
} from '.';
import * as resolvers from './resolvers';

const arrayOperations = new Set(['in', 'nin']);
const basicOperations = new Set(['ne', 'notnull', 'null']);
const likeOperations = new Set(['like', 'ilike']);
const mathOperations = new Set(['gt', 'gte', 'lt', 'lte']);

const entityTypes = new Map<string, GraphQLObjectType>();
const enumTypes = new Map<string, GraphQLEnumType>();
const filterTypes = new Map<string, GraphQLInputObjectType>();
const paginationTypes = new Map<string, GraphQLInputObjectType>();

const scalarShouldGetLikeOperations = (scalar: GraphQLScalarType) => scalar === GraphQLString;
const scalarShouldGetMathOperations = (
	scalar: GraphQLScalarType | NumberConstructor | DateConstructor
) => scalar === Number || scalar === Date || scalar.name === 'ISOString';

const graphQLTypeForEnum = (enumMetadata: EnumMetadata<any>) => {
	let enumType = enumTypes.get(enumMetadata.name);

	if (!enumType) {
		const values: GraphQLEnumValueConfigMap = {};
		for (const [key, value] of Object.entries(enumMetadata.target)) {
			values[key] = { value };
		}

		enumType = new GraphQLEnumType({
			name: enumMetadata.name,
			values,
		});

		enumTypes.set(enumMetadata.name, enumType);
	}

	return enumType;
};

const graphQLScalarForTypeScriptType = (type: TypeValue): GraphQLScalarType => {
	switch (type) {
		case String:
			return GraphQLString;
		case Number:
			return GraphQLFloat;
		case Boolean:
			return GraphQLBoolean;
		default:
			throw new Error(`Could not map TypeScript type ${String(type)} to a GraphQL scalar.`);
	}
};

const graphQLTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let entityType = entityTypes.get(entity.name);

	if (!entityType) {
		entityType = new GraphQLObjectType({
			name: entity.name,
			description: entity.description,
			fields: () => {
				const fields: ObjMap<GraphQLFieldConfig<unknown, unknown>> = {};

				for (const field of entity.fields) {
					let type = field.getType();
					let isArray = false;
					if (Array.isArray(type)) {
						type = type[0];
						isArray = true;
					}

					// Let's try to resolve the GraphQL type involved here.
					let graphQLType: GraphQLOutputType | undefined = undefined;

					const metadata = graphweaverMetadata.metadataForType(type);
					if (isEntityMetadata(metadata)) {
						graphQLType = graphQLTypeForEntity(metadata);
					} else if (isEnumMetadata(metadata)) {
						graphQLType = graphQLTypeForEnum(metadata);
					} else if (isScalarType(field.getType())) {
						graphQLType = type as GraphQLScalarType;
					} else {
						// Ok, it's some kind of in-built scalar we need to map.
						const scalar = graphQLScalarForTypeScriptType(type);

						if (!scalar) {
							throw new Error(
								`Could not map field ${field.name} on entity ${entity.name} of type ${String(field.getType())} to a GraphQL scalar.`
							);
						}

						graphQLType = scalar;
					}

					// If it's an array, wrap it in a list and make it not nullable within the list.
					if (isArray) {
						graphQLType = new GraphQLList(new GraphQLNonNull(graphQLType));
					}

					// And finally, if it's not marked as nullable, wrap whatever it is in Non Null.
					if (!field.nullable) {
						graphQLType = new GraphQLNonNull(graphQLType);
					}

					fields[field.name] = { type: graphQLType };
				}

				return fields;
			},
		});

		entityTypes.set(entity.name, entityType);
	}

	return entityType;
};

const filterTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let filterType = filterTypes.get(entity.name);
	if (!filterType) {
		filterType = new GraphQLInputObjectType({
			name: `${entity.plural}ListFilter`,
			description: entity.description,
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {};

				for (const field of entity.fields) {
					const fieldType = field.getType();
					const metadata = graphweaverMetadata.metadataForType(fieldType);

					if (isEntityMetadata(metadata)) {
						if (
							// These conditions are separate from the `if` above because we don't want to
							// go down the else if chain for entities regardless of whether these options
							// are set or not.
							!metadata.apiOptions?.excludeFromBuiltInOperations &&
							!metadata.apiOptions?.excludeFromFiltering
						) {
							fields[field.name] = {
								type: filterTypeForEntity(metadata),
							};
						}
					} else if (isScalarType(fieldType)) {
						// All scalars get array operations
						for (const operation of arrayOperations) {
							fields[`${field.name}_${operation}`] = {
								type: new GraphQLList(new GraphQLNonNull(fieldType)),
							};
						}

						// And basic operations too
						for (const operation of basicOperations) {
							fields[`${field.name}_${operation}`] =
								// null and notnull are boolean operations instead of the type of the field.
								operation === 'null' || operation === 'notnull'
									? { type: GraphQLBoolean }
									: { type: fieldType };
						}

						// But only strings get `like` and `ilike`.
						if (scalarShouldGetLikeOperations(fieldType)) {
							for (const operation of likeOperations) {
								fields[`${field.name}_${operation}`] = { type: fieldType };
							}
						}

						// Numbers and dates get `gt`, `gte`, `lt`, and `lte`.
						if (scalarShouldGetMathOperations(fieldType)) {
							for (const operation of mathOperations) {
								fields[`${field.name}_${operation}`] = { type: fieldType };
							}
						}
					}
				}

				return fields;
			},
		});

		filterTypes.set(entity.name, filterType);
	}

	return filterType;
};

const paginationTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let paginationType = paginationTypes.get(entity.name);
	const sortEnumMetadata = graphweaverMetadata.getEnumByName('Sort');
	if (!sortEnumMetadata) throw new Error('Could not locate Sort enum, which should be built in.');
	const sortEnum = graphQLTypeForEnum(sortEnumMetadata);

	if (!paginationType) {
		paginationType = new GraphQLInputObjectType({
			name: `${entity.plural}PaginationInput`,
			description: `Pagination options for ${entity.plural}.`,
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {
					offset: { type: GraphQLInt },
					limit: { type: GraphQLInt },
				};

				// In order to know if we want to add orderBy to the type, we
				// need to know how many sortable fields there actually are on the entity.
				const orderByFields: ObjMap<GraphQLInputFieldConfig> = {};

				for (const field of entity.fields) {
					// Let's try to resolve the GraphQL type involved here.
					const fieldType = field.getType();
					const metadata = graphweaverMetadata.metadataForType(fieldType);

					if (isEntityMetadata(metadata)) {
						// We don't sort on relationships.
						continue;
					}

					// But if we're here, we do allow sorting.
					orderByFields[field.name] = { type: sortEnum };
				}

				if (Object.keys(orderByFields).length > 0) {
					// Ok, there's something we can sort by, let's add the field.
					fields['orderBy'] = {
						type: new GraphQLInputObjectType({
							name: `${entity.plural}OrderByInput`,
							fields: orderByFields,
						}),
					};
				}

				return fields;
			},
		});

		paginationTypes.set(entity.name, paginationType);
	}

	return paginationType;
};

export interface SchemaBuilderOptions {
	authChecker?: AuthChecker<any, any>;
}

class SchemaBuilderImplementation {
	public build(args?: SchemaBuilderOptions) {
		// Note: It's really important that this runs before the query and mutation
		// steps below, as the fields in those reference the types we generate here.
		const types = Array.from(this.buildTypes());
		const query = this.buildQueryType(args);
		const mutation = this.buildMutationType(args);

		logger.trace({ types, query, mutation }, 'Built schema');

		return new GraphQLSchema({ types, query, mutation });
	}

	public print(args?: SchemaBuilderOptions) {
		return printSchema(this.build(args));
	}

	private *buildTypes() {
		for (const entity of graphweaverMetadata.entities()) {
			// The core entity object type
			yield graphQLTypeForEntity(entity);

			// The input type for filtering
			if (
				!entity.apiOptions?.excludeFromBuiltInOperations &&
				!entity.apiOptions?.excludeFromFiltering
			) {
				yield filterTypeForEntity(entity);
			}

			// The input type for pagination and sorting
			yield paginationTypeForEntity(entity);
		}

		for (const enumType of graphweaverMetadata.enums()) {
			yield graphQLTypeForEnum(enumType);
		}
	}

	private buildQueryType(args?: SchemaBuilderOptions) {
		return new GraphQLObjectType({
			name: 'Query',
			fields: () => {
				const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {};

				for (const entity of graphweaverMetadata.entities()) {
					// If it's excluded from built-in operations, skip it.
					if (entity.apiOptions?.excludeFromBuiltInOperations) continue;

					// Get One
					const oneQueryName = entity.name.charAt(0).toLowerCase() + entity.name.substring(1);
					if (fields[oneQueryName]) {
						throw new Error(`Duplicate query name: ${oneQueryName}.`);
					}
					fields[oneQueryName] = {
						description: `Get a single ${entity.name}.`,
						type: graphQLTypeForEntity(entity),
						args: {
							filter: { type: filterTypeForEntity(entity) },
						},
						resolve: resolvers.getOne,
					};

					// List
					const listQueryName = entity.plural.charAt(0).toLowerCase() + entity.plural.substring(1);
					if (fields[listQueryName]) {
						throw new Error(`Duplicate query name: ${listQueryName}.`);
					}
					fields[listQueryName] = {
						description: `Get multiple ${entity.plural}.`,
						type: new GraphQLList(graphQLTypeForEntity(entity)),
						args: {
							filter: { type: filterTypeForEntity(entity) },
							pagination: { type: paginationTypeForEntity(entity) },
						},
						resolve: resolvers.list,
					};
				}

				// Add any user-defined additional queries too
				for (const customQuery of graphweaverMetadata.additionalQueries()) {
					if (fields[customQuery.name]) {
						throw new Error(`Duplicate query name: ${customQuery.name}.`);
					}

					const type = customQuery.getType();
					const metadata = graphweaverMetadata.metadataForType(type);

					if (isEntityMetadata(metadata)) {
						// We're no longer checking for `excludeFromBuiltInOperations` here because this is
						// a user or system defined additional query, so by definition it needs to be included here.
						fields[customQuery.name] = {
							...customQuery,

							type: graphQLTypeForEntity(metadata),
							resolve: customQuery.resolver,
						};
					} else {
						fields[customQuery.name] = {
							...customQuery,

							type,
							resolve: customQuery.resolver,
						};
					}
				}
				return fields;
			},
		});
	}

	private buildMutationType(args?: SchemaBuilderOptions) {
		return undefined;
	}
}

export const SchemaBuilder = new SchemaBuilderImplementation();
