import {
	GraphQLArgumentConfig,
	GraphQLBoolean,
	GraphQLDirective,
	GraphQLEnumType,
	GraphQLEnumValueConfigMap,
	GraphQLFieldConfig,
	GraphQLFieldConfigArgumentMap,
	GraphQLFloat,
	GraphQLInputFieldConfig,
	GraphQLInputObjectType,
	GraphQLInputType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLObjectTypeExtensions,
	GraphQLOutputType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	GraphQLUnionType,
	isListType,
	isNonNullType,
	isObjectType,
	isScalarType,
	ThunkObjMap,
} from 'graphql';
import { ObjMap } from 'graphql/jsutils/ObjMap';
import { logger, safeErrorLog } from '@exogee/logger';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

import { FieldMetadata, GetTypeFunction, ID, TypeValue } from './types';
import {
	ArgsMetadata,
	EntityMetadata,
	EnumMetadata,
	graphweaverMetadata,
	InputTypeMetadata,
	isArgMetadata,
	isEntityMetadata,
	isEnumMetadata,
	isInputMetadata,
	isUnionMetadata,
	MetadataType,
	UnionMetadata,
} from './metadata';
import { trace } from './open-telemetry';
import * as resolvers from './resolvers';
import {
	allOperations,
	arrayOperations,
	basicOperations,
	likeOperations,
	mathOperations,
} from './operations';
import { GraphQLByte, ISODateStringScalar } from '@exogee/graphweaver-scalars';

export type GraphweaverSchemaExtension = Readonly<GraphQLObjectTypeExtensions<any, any>> & {
	graphweaverSchemaInfo:
		| GraphweaverSchemaInfoExtensionWithSourceEntity
		| GraphweaverOtherSchemaInfoExtension;
};

export type GraphweaverOtherSchemaInfoExtension = {
	type: 'deleteOneFilterInput' | 'aggregationResult' | 'customInput';
};

export type GraphweaverSchemaInfoExtensionWithSourceEntity = {
	type:
		| 'entity'
		| 'paginationInput'
		| 'createOrUpdateInput'
		| 'updateInput'
		| 'createInput'
		| 'filterInput'
		| 'createOne'
		| 'createMany'
		| 'updateOne'
		| 'updateMany'
		| 'createOrUpdateMany'
		| 'deleteOne'
		| 'deleteMany';

	sourceEntity: EntityMetadata<any, any>;
};

class TypeCache {
	public readonly entityTypes = new Map<string, GraphQLObjectType>();
	public readonly inputTypes = new Map<string, GraphQLInputObjectType>();
	public readonly enumTypes = new Map<string, GraphQLEnumType>();
	public readonly unionTypes = new Map<string, GraphQLUnionType>();
	public readonly filterTypes = new Map<string, GraphQLInputObjectType>();
	public readonly insertTypes = new Map<string, GraphQLInputObjectType>();
	public readonly updateTypes = new Map<string, GraphQLInputObjectType>();
	public readonly createOrUpdateTypes = new Map<string, GraphQLInputObjectType>();
	public readonly paginationTypes = new Map<string, GraphQLInputObjectType>();
	public readonly deleteOneTypes = new Map<string, GraphQLInputObjectType>();
}
type EntityFilter = (entity: EntityMetadata<any, any>) => boolean;
const typeCaches = new Map<EntityFilter | undefined, TypeCache>();

const typeCacheForEntityFilter = (entityFilter: EntityFilter | undefined) => {
	if (!typeCaches.has(entityFilter)) {
		typeCaches.set(entityFilter, new TypeCache());
	}

	return typeCaches.get(entityFilter)!;
};

const scalarShouldGetLikeOperations = (scalar: GraphQLScalarType) => scalar === GraphQLString;
const scalarShouldGetMathOperations = (
	scalar: GraphQLScalarType | NumberConstructor | DateConstructor | BigIntConstructor
) =>
	scalar === Number ||
	scalar === Date ||
	scalar === BigInt ||
	scalar.name === 'ID' ||
	scalar.name === 'String' ||
	scalar.name === 'Date' ||
	scalar.name === 'DateScalar' ||
	scalar.name === 'ISOString' ||
	scalar.name === 'Float' ||
	(scalar instanceof GraphQLScalarType && scalar?.extensions?.type === 'integer');

const graphQLTypeForEnum = (
	enumMetadata: EnumMetadata<any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let enumType = typeCache.enumTypes.get(enumMetadata.name);

	if (!enumType) {
		const values: GraphQLEnumValueConfigMap = {};
		for (const [key, value] of Object.entries(enumMetadata.target)) {
			values[key] = { value };
		}

		enumType = new GraphQLEnumType({
			name: enumMetadata.name,
			values,
		});

		typeCache.enumTypes.set(enumMetadata.name, enumType);
	}

	return enumType;
};

const graphQLTypeForUnion = (
	unionMetadata: UnionMetadata,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let unionType = typeCache.unionTypes.get(unionMetadata.name);

	if (!unionType) {
		const entitiesInUnion = unionMetadata.getTypes();

		// Ensure types is an array
		if (!Array.isArray(entitiesInUnion)) {
			throw new Error(`Union ${unionMetadata.name} has a non-array types field.`);
		}

		// Ensure types is not empty
		if (entitiesInUnion.length === 0) {
			throw new Error(`Union ${unionMetadata.name} has no types.`);
		}

		// Map types to GraphQL types
		const graphQLTypes = entitiesInUnion.map((type) => {
			// Both entity types and GraphQL types can end up here. If it's already a
			// GraphQL type we're good to go.
			if (isObjectType(type)) {
				// Ensure we're looking at an entity type
				if (
					(type.extensions as GraphweaverSchemaExtension).graphweaverSchemaInfo.type !== 'entity'
				) {
					throw new Error(
						`Union ${unionMetadata.name} has a GraphQLType ${type} which did not originate from an entity.`
					);
				}

				return type;
			}

			if (isEntityMetadata(type)) {
				const entityType = typeCache.entityTypes.get(type.name);
				if (!entityType) {
					throw new Error(
						`Union ${unionMetadata.name} has entity type ${type} which could not be looked up in the type cache.`
					);
				}
				return entityType;
			}

			throw new Error(
				`Type ${type} is neither a GraphQLObjectType, nor an EntityMetadata Type in union ${unionMetadata.name}.`
			);
		});

		unionType = new GraphQLUnionType({
			name: unionMetadata.name,
			description: unionMetadata.description,
			types: graphQLTypes,
		});

		typeCache.unionTypes.set(unionMetadata.name, unionType);
	}

	return new GraphQLNonNull(new GraphQLList(unionType));
};

// All aggregations follow the same shape so we only need one of those too.
const aggregationResult = new GraphQLObjectType({
	name: 'AggregationResult',
	extensions: { graphweaverSchemaInfo: { type: 'aggregationResult' } },
	fields: {
		count: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (parent) => parent.count,
		},
	},
});

export const getFieldTypeWithMetadata = (
	getType: GetTypeFunction
): {
	fieldType: TypeValue;
	isList: boolean;
	metadata?: MetadataType;
} => {
	let fieldType = getType();
	let isList = false;
	if (Array.isArray(fieldType)) {
		isList = true;
		fieldType = fieldType[0];
	}
	const metadata = graphweaverMetadata.metadataForType(fieldType);

	return { fieldType, isList, metadata };
};

export const getFieldType = (field: FieldMetadata<any, any>): TypeValue => {
	const unwrapType = (type: TypeValue): TypeValue => {
		if (isListType(type) || isNonNullType(type)) {
			return unwrapType(type.ofType);
		}
		if (isGraphQLScalarForTypeScriptType(type)) {
			try {
				return graphQLScalarForTypeScriptType(type);
			} catch (e) {
				console.error(e);
				throw new Error(
					`Could not map TypeScript type ${String(type)} to a GraphQL scalar for field ${field.name} on entity ${field.target.name}. Original Error: ${e}`
				);
			}
		}
		return type;
	};

	return unwrapType(field.getType());
};

export const isGraphQLScalarForTypeScriptType = (type: TypeValue) => {
	switch (type) {
		case String:
		case Number:
		case Boolean:
		case Date:
			return true;
		default:
			return false;
	}
};

const graphQLScalarForTypeScriptType = (type: TypeValue): GraphQLScalarType => {
	if (isScalarType(type)) return type;

	switch (type) {
		case Boolean:
			return GraphQLBoolean;
		case Buffer:
			return GraphQLByte;
		case Date:
			return ISODateStringScalar;
		case Number:
			return GraphQLFloat;
		case String:
			return GraphQLString;

		default:
			throw new Error(`Could not map TypeScript type ${String(type)} to a GraphQL scalar.`);
	}
};

const graphQLTypeForScalarEnumOrUnion = (
	metadata: unknown,
	type: TypeValue,
	entityFilter: EntityFilter | undefined
) => {
	if (isEnumMetadata(metadata)) {
		return graphQLTypeForEnum(metadata, entityFilter);
	} else if (isUnionMetadata(metadata)) {
		return graphQLTypeForUnion(metadata, entityFilter);
	}

	return graphQLScalarForTypeScriptType(type);
};

type GraphQLInputTypes =
	| GraphQLInputType
	| GraphQLScalarType
	| GraphQLEnumType
	| GraphQLUnionType
	| GraphQLList<any>
	| GraphQLNonNull<any>;

const graphQLTypeForInput = (
	input: InputTypeMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let inputType = typeCache.inputTypes.get(input.name);

	if (!inputType) {
		inputType = new GraphQLInputObjectType({
			name: input.name,
			description: input.description,
			extensions: { graphweaverSchemaInfo: { type: 'customInput' } },
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {};

				for (const field of Object.values(input.fields)) {
					try {
						// Let's try to resolve the GraphQL type involved here.
						const { fieldType, isList, metadata } = getFieldTypeWithMetadata(field.getType);
						let graphQLType: GraphQLInputTypes | undefined = undefined;

						if (isInputMetadata(metadata)) {
							graphQLType = graphQLTypeForInput(metadata, entityFilter);
						} else {
							graphQLType = graphQLTypeForScalarEnumOrUnion(metadata, fieldType, entityFilter);
						}

						// If it's an array, wrap it in a list and make it not nullable within the list.
						if (isList) {
							graphQLType = new GraphQLList(new GraphQLNonNull(graphQLType));
						}

						// And finally, if it's not marked as nullable, wrap whatever it is in Non Null.
						if (!field.nullable) {
							graphQLType = new GraphQLNonNull(graphQLType);
						}

						fields[field.name] = { type: graphQLType };
					} catch (e) {
						safeErrorLog(logger, e);
						throw new Error(
							`Error while generating schema for input type. Field: ${field.name}, Type: ${String(field.getType())}, Input: ${input.name}. Original Error: ${e}`
						);
					}
				}

				return fields;
			},
		});
	}

	typeCache.inputTypes.set(input.name, inputType);

	return inputType;
};

// This is exported because deep within the create or update logic we need to stub a GraphQLResolveInfo object.
// It's not meant to be used as a public API, please use the SchemaBuilder export unless you have a good reason not to.
export const graphQLTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let entityType = typeCache.entityTypes.get(entity.name);

	if (!entityType) {
		entityType = new GraphQLObjectType({
			name: graphweaverMetadata.federationNameForEntity(entity),
			description: entity.description,
			extensions: {
				directives: entity.directives ?? {},
				graphweaverSchemaInfo: { type: 'entity', sourceEntity: entity },
			},
			fields: () => {
				const fields: ObjMap<GraphQLFieldConfig<unknown, unknown>> = {};

				for (const field of Object.values(entity.fields)) {
					// Let's try to resolve the GraphQL type involved here.
					const { fieldType, isList, metadata } = getFieldTypeWithMetadata(field.getType);
					let graphQLType: GraphQLOutputType | undefined = undefined;
					let resolve = undefined;
					const args: ObjMap<GraphQLArgumentConfig> = {};

					try {
						if (isEntityMetadata(metadata)) {
							// If the entity filter says no, we don't need to build out this field.
							if (entityFilter && !entityFilter(metadata)) continue;

							graphQLType = graphQLTypeForEntity(metadata, entityFilter);

							if (metadata.provider) {
								resolve = resolvers.baseResolver(resolvers.listRelationshipField);

								if (metadata.provider.backendProviderConfig?.filter) {
									args['filter'] = {
										type: filterTypeForEntity(metadata, entityFilter),
									};
								}
							} else {
								resolve = resolvers.baseResolver(resolvers.listRelationshipFieldWithoutProvider);
							}
						} else {
							// Ok, it's some kind of in-built scalar we need to map.
							graphQLType = graphQLTypeForScalarEnumOrUnion(metadata, fieldType, entityFilter);
						}

						// If it's an array, wrap it in a list and make it not nullable within the list.
						if (isList) {
							graphQLType = new GraphQLList(new GraphQLNonNull(graphQLType));
						}

						// And finally, if it's not marked as nullable, wrap whatever it is in Non Null.
						if (!field.nullable) {
							graphQLType = new GraphQLNonNull(graphQLType);
						}

						if (fields[field.name]) {
							throw new Error(`Duplicate field '${field.name}' on entity ${entity.name}.`);
						}

						fields[field.name] = {
							type: graphQLType,
							args,
							// Typecast should not be required here as we know the context object, but this will get us building.
							resolve: resolve as any,
							extensions: {
								directives: field.directives ?? {},
							},
						};
					} catch (e) {
						safeErrorLog(logger, e);
						throw new Error(
							`Error while generating schema for entity. Field: ${field.name}, Type: ${String(field.getType())}, Entity: ${entity.name}. Original Error: ${e}`
						);
					}

					// If the it's a related entity and the provider supports it, we should add aggregation to the relationship.
					if (
						isEntityMetadata(metadata) &&
						metadata.provider?.backendProviderConfig?.supportedAggregationTypes?.size &&
						metadata.provider?.backendProviderConfig?.filter
					) {
						if (fields[`${field.name}_aggregate`]) {
							throw new Error(
								`Duplicate field '${field.name}_aggregate' on entity ${entity.name}.`
							);
						}

						fields[`${field.name}_aggregate`] = {
							type: aggregationResult,
							args: {
								filter: { type: filterTypeForEntity(metadata, entityFilter) },
							},

							// TODO: Why is any required here?
							resolve: resolvers.baseResolver(
								resolvers.aggregateRelationshipField(entity, field)
							) as any,
						};
					}
				}

				return fields;
			},
		});

		typeCache.entityTypes.set(entity.name, entityType);
	}

	return entityType;
};

const filterTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let filterType = typeCache.filterTypes.get(entity.name);
	if (!filterType) {
		filterType = new GraphQLInputObjectType({
			name: `${entity.plural}ListFilter`,
			description: entity.description,
			extensions: { graphweaverSchemaType: 'filterInput' },
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {};

				// Add top level and/or/not
				const selfFilter = filterTypeForEntity(entity, entityFilter);
				fields['_and'] = { type: new GraphQLList(selfFilter) };
				fields['_or'] = { type: new GraphQLList(selfFilter) };
				fields['_not'] = { type: selfFilter };

				for (const field of Object.values(entity.fields)) {
					const fieldType = getFieldType(field);
					const metadata = graphweaverMetadata.metadataForType(fieldType);

					if (isEntityMetadata(metadata)) {
						// If the entity filter says no, we don't need to build out this field.
						if (entityFilter && !entityFilter(metadata)) continue;

						if (
							// These conditions are separate from the `if` above because we don't want to
							// go down the else if chain for entities regardless of whether these options
							// are set or not.
							!metadata.apiOptions?.excludeFromBuiltInOperations &&
							!metadata.apiOptions?.excludeFromFiltering
						) {
							fields[field.name] = {
								type: filterTypeForEntity(metadata, entityFilter),
							};
						}
					} else if (isEnumMetadata(metadata)) {
						const enumFieldType = graphQLTypeForEnum(metadata, entityFilter);

						// Enums get basic and array operations.
						fields[field.name] = { type: enumFieldType };
						for (const operation of arrayOperations) {
							fields[`${field.name}_${operation}`] = {
								type: new GraphQLList(new GraphQLNonNull(enumFieldType)),
							};
						}
					} else if (isScalarType(fieldType)) {
						// Scalars get a basic operation.
						fields[field.name] = { type: fieldType };

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

		typeCache.filterTypes.set(entity.name, filterType);
	}

	return filterType;
};

const paginationTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let paginationType = typeCache.paginationTypes.get(entity.name);
	const sortEnumMetadata = graphweaverMetadata.getEnumByName('Sort');
	if (!sortEnumMetadata) throw new Error('Could not locate Sort enum, which should be built in.');
	const sortEnum = graphQLTypeForEnum(sortEnumMetadata, entityFilter);

	if (!paginationType) {
		paginationType = new GraphQLInputObjectType({
			name: `${entity.plural}PaginationInput`,
			description: `Pagination options for ${entity.plural}.`,
			extensions: { graphweaverSchemaType: 'paginationInput' },
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {
					offset: { type: GraphQLInt },
					limit: { type: GraphQLInt },
				};

				// In order to know if we want to add orderBy to the type, we
				// need to know how many sortable fields there actually are on the entity.
				const orderByFields: ObjMap<GraphQLInputFieldConfig> = {};

				for (const field of Object.values(entity.fields)) {
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

		typeCache.paginationTypes.set(entity.name, paginationType);
	}

	return paginationType;
};

const generateGraphQLInputFieldsForEntity =
	(
		entity: EntityMetadata<any, any>,
		input: 'insert' | 'update' | 'createOrUpdate',
		entityFilter: EntityFilter | undefined
	) =>
	() => {
		const fields: ObjMap<GraphQLInputFieldConfig> = {};
		for (const field of Object.values(entity.fields)) {
			// If it's excluded from built-in write operations, skip it.
			if (field.apiOptions?.excludeFromBuiltInWriteOperations) continue;

			// The ID field is a special case based on the input type.
			if (field.name === (entity.primaryKeyField ?? 'id')) {
				switch (input) {
					case 'insert':
						if (entity.apiOptions?.clientGeneratedPrimaryKeys) {
							fields[field.name] = { type: new GraphQLNonNull(ID) };
						}
						break;
					case 'createOrUpdate':
						if (entity.apiOptions?.clientGeneratedPrimaryKeys) {
							fields[field.name] = { type: new GraphQLNonNull(ID) };
						} else {
							fields[field.name] = { type: ID };
						}
						break;
					case 'update':
						fields[field.name] = { type: new GraphQLNonNull(ID) };
						break;
					default:
						break;
				}
				continue;
			}

			// Let's try to resolve the GraphQL type involved here.
			const { fieldType, metadata, isList } = getFieldTypeWithMetadata(field.getType);

			if (isEntityMetadata(metadata)) {
				// If the entity filter says no, we don't need to build out this field.
				if (entityFilter && !entityFilter(metadata)) continue;

				// This if is separate to stop us cascading down to the scalar branch for entities that
				if (
					!metadata.apiOptions?.excludeFromBuiltInOperations &&
					!metadata.apiOptions?.excludeFromBuiltInWriteOperations
				) {
					let type: GraphQLInputType = createOrUpdateTypeForEntity(metadata, entityFilter);

					if (isList) {
						// If it's a many relationship we need to wrap in non-null and list.
						type = new GraphQLList(new GraphQLNonNull(type));
					}

					fields[field.name] = { type };
				}
			} else {
				fields[field.name] = {
					type: graphQLTypeForScalarEnumOrUnion(
						metadata,
						fieldType,
						entityFilter
					) as GraphQLInputType,
				};
			}

			// If it's not a nullable field and has no default then we should wrap it now in a not null.
			if (
				input === 'insert' &&
				!field.nullable &&
				typeof field.defaultValue === 'undefined' &&
				field.relationshipInfo === undefined
			) {
				fields[field.name] = { type: new GraphQLNonNull(fields[field.name].type) };
			}
		}

		return fields;
	};

const deleteOneTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let deleteType = typeCache.deleteOneTypes.get(entity.name);

	if (!deleteType) {
		const primaryKeyFieldName = entity.primaryKeyField ?? 'id';
		deleteType = new GraphQLInputObjectType({
			name: `${entity.name}DeleteOneFilterInput`,
			description: `Data needed to delete one ${entity.name}.`,
			extensions: { graphweaverSchemaType: 'deleteOneFilterInput' },
			fields: {
				[primaryKeyFieldName]: { type: new GraphQLNonNull(ID) },
			}
		});

		typeCache.deleteOneTypes.set(entity.name, deleteType);
	}

	return deleteType;
};

const insertTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let insertType = typeCache.insertTypes.get(entity.name);

	if (!insertType) {
		insertType = new GraphQLInputObjectType({
			name: `${entity.name}InsertInput`,
			description: `Data needed to create ${entity.plural}.`,
			extensions: { graphweaverSchemaType: 'insertInput' },
			fields: generateGraphQLInputFieldsForEntity(entity, 'insert', entityFilter),
		});

		typeCache.insertTypes.set(entity.name, insertType);
	}

	return insertType;
};

const createOrUpdateTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let createOrUpdateType = typeCache.createOrUpdateTypes.get(entity.name);

	if (!createOrUpdateType) {
		createOrUpdateType = new GraphQLInputObjectType({
			name: `${entity.name}CreateOrUpdateInput`,
			description: `Data needed to create or update ${entity.plural}. If an ID is passed, this is an update, otherwise it's an insert.`,
			extensions: { graphweaverSchemaType: 'createOrUpdateInput' },
			fields: generateGraphQLInputFieldsForEntity(entity, 'createOrUpdate', entityFilter),
		});

		typeCache.createOrUpdateTypes.set(entity.name, createOrUpdateType);
	}

	return createOrUpdateType;
};

const updateTypeForEntity = (
	entity: EntityMetadata<any, any>,
	entityFilter: EntityFilter | undefined
) => {
	const typeCache = typeCacheForEntityFilter(entityFilter);
	let updateType = typeCache.updateTypes.get(entity.name);

	if (!updateType) {
		updateType = new GraphQLInputObjectType({
			name: `${entity.name}UpdateInput`,
			description: `Data needed to update ${entity.plural}. An ID must be passed.`,
			extensions: { graphweaverSchemaType: 'updateInput' },
			fields: generateGraphQLInputFieldsForEntity(entity, 'update', entityFilter),
		});

		typeCache.updateTypes.set(entity.name, updateType);
	}

	return updateType;
};

type SchemaBuildOptions = {
	schemaDirectives?: Record<string, unknown>;
	filterEntities?: (entity: EntityMetadata<any, any>) => boolean;
};

class SchemaBuilderImplementation {
	public build(buildOptions?: SchemaBuildOptions) {
		const { schemaDirectives } = buildOptions ?? {};

		// Before we get started, let's validate their now complete decorator situation.
		graphweaverMetadata.validateEntities();

		// Note: It's really important that this runs before the query and mutation
		// steps below, as the fields in those reference the types we generate here.
		const directives = Array.from(this.buildDirectives(buildOptions?.filterEntities));

		const types = Array.from(this.buildTypes(buildOptions?.filterEntities));
		const query = this.buildQueryType(buildOptions?.filterEntities);
		const mutation = this.buildMutationType(buildOptions?.filterEntities);

		logger.trace({ types, query, mutation, directives }, 'Built schema');

		return new GraphQLSchema({
			types,
			query,
			mutation,
			directives,
			extensions: { directives: schemaDirectives ?? {} },
		});
	}

	public print(buildOptions?: SchemaBuildOptions) {
		return printSchemaWithDirectives(this.build(buildOptions));
	}

	public isValidFilterOperation(filterOperation: string) {
		return allOperations.has(filterOperation);
	}

	private *buildTypes(entityFilter: EntityFilter | undefined) {
		for (const entity of graphweaverMetadata.entities()) {
			if (entityFilter && !entityFilter(entity)) continue;

			// The core entity object type
			yield graphQLTypeForEntity(entity, entityFilter);

			if (
				!entity.apiOptions?.excludeFromBuiltInOperations &&
				!entity.apiOptions?.excludeFromFiltering
			) {
				// The input type for filtering
				yield filterTypeForEntity(entity, entityFilter);
			}

			if (
				!entity.apiOptions?.excludeFromBuiltInOperations &&
				!entity.apiOptions?.excludeFromBuiltInWriteOperations
			) {
				// The input type for inserting
				yield insertTypeForEntity(entity, entityFilter);

				// The input type for inserting
				yield updateTypeForEntity(entity, entityFilter);

				// The input type for creating or updating
				yield createOrUpdateTypeForEntity(entity, entityFilter);
			}

			// The input type for pagination and sorting
			// This is only emitted if the entity has a provider, as it's only used for querying.
			if (entity.provider) {
				yield paginationTypeForEntity(entity, entityFilter);
			}
		}

		// Also emit all our input types.
		for (const input of graphweaverMetadata.inputTypes()) {
			yield graphQLTypeForInput(input, entityFilter);
		}

		// Also emit all our enums.
		for (const enumType of graphweaverMetadata.enums()) {
			yield graphQLTypeForEnum(enumType, entityFilter);
		}

		// The AggregationResult type might need to be namespaced for Federation
		aggregationResult.name =
			graphweaverMetadata.federationNameForGraphQLTypeName('AggregationResult');

		yield aggregationResult;
	}

	private graphQLTypeForArgs(
		entityFilter: EntityFilter | undefined,
		args?: ArgsMetadata
	): GraphQLFieldConfigArgumentMap {
		const map: GraphQLFieldConfigArgumentMap = {};
		if (!args) return map;

		for (const [name, details] of Object.entries(args)) {
			try {
				const getType = isArgMetadata(details) ? details.type : details;

				const { fieldType, metadata, isList } = getFieldTypeWithMetadata(getType);

				let inputType: GraphQLInputTypes;
				if (isInputMetadata(metadata)) {
					inputType = graphQLTypeForInput(metadata, entityFilter);
				} else {
					inputType = graphQLTypeForScalarEnumOrUnion(metadata, fieldType, entityFilter);
				}

				if (isArgMetadata(details) && !details.nullable) {
					inputType = new GraphQLNonNull(inputType);
				}

				if (isList) {
					inputType = new GraphQLList(inputType);
				}

				map[name] = {
					type: inputType,
					// Apply the default value if there is one.
					...(isArgMetadata(details) && details.defaultValue
						? { defaultValue: details.defaultValue }
						: {}),
				};
			} catch (e) {
				safeErrorLog(logger, e);
				throw new Error(
					`Error while generating schema for args. Name: ${name}, Details: ${details}, Args: ${JSON.stringify(args)}. Original Error: ${e}`
				);
			}
		}

		return map;
	}

	private buildQueryType(entityFilter: EntityFilter | undefined) {
		return new GraphQLObjectType({
			name: 'Query',
			fields: () => {
				const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {};

				for (const entity of graphweaverMetadata.entities()) {
					// If the entityFilter says no, skip it.
					if (entityFilter && !entityFilter(entity)) continue;
					// If it's excluded from built-in operations, skip it.
					if (entity.apiOptions?.excludeFromBuiltInOperations) continue;
					// If this entity does not have a data provider, skip it.
					if (!entity.provider) continue;

					// Get One
					const oneQueryName = entity.name.charAt(0).toLowerCase() + entity.name.substring(1);
					if (fields[oneQueryName]) {
						throw new Error(`Duplicate query name: ${oneQueryName}.`);
					}
					fields[oneQueryName] = {
						description: `Get a single ${entity.name}.`,
						type: graphQLTypeForEntity(entity, entityFilter),
						args: {
							id: { type: new GraphQLNonNull(ID) },
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'getOne', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.getOne),
					};

					// List
					const listQueryName = entity.plural.charAt(0).toLowerCase() + entity.plural.substring(1);
					if (fields[listQueryName]) {
						throw new Error(`Duplicate query name: ${listQueryName}.`);
					}
					fields[listQueryName] = {
						description: `Get multiple ${entity.plural}.`,
						type: new GraphQLList(graphQLTypeForEntity(entity, entityFilter)),
						args: {
							filter: { type: filterTypeForEntity(entity, entityFilter) },
							pagination: { type: paginationTypeForEntity(entity, entityFilter) },
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'list', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.list),
					};

					// Aggregations
					if ((entity.provider.backendProviderConfig?.supportedAggregationTypes?.size ?? 0) > 0) {
						fields[`${listQueryName}_aggregate`] = {
							description: `Get aggregated data for ${entity.plural}.`,
							type: aggregationResult,
							args: {
								filter: { type: filterTypeForEntity(entity, entityFilter) },
							},
							extensions: {
								graphweaverSchemaInfo: { type: 'aggregate', sourceEntity: entity },
							},
							resolve: resolvers.baseResolver(resolvers.aggregate),
						};
					}
				}

				// Add any user-defined additional queries too
				for (const customQuery of graphweaverMetadata.additionalQueries()) {
					if (fields[customQuery.name]) {
						throw new Error(`Duplicate query name: ${customQuery.name}.`);
					}

					try {
						const { fieldType, isList, metadata } = getFieldTypeWithMetadata(customQuery.getType);
						const customArgs = this.graphQLTypeForArgs(entityFilter, customQuery.args);

						if (isEntityMetadata(metadata)) {
							// If the entity filter says no, we will ignore their custom query because it references
							// an entity that is filtered out of this schema.
							if (entityFilter && !entityFilter(metadata)) continue;

							const graphQLType = graphQLTypeForEntity(metadata, entityFilter);

							// We're no longer checking for `excludeFromBuiltInOperations` here because this is
							// a user or system defined additional query, so by definition it needs to be included here.
							fields[customQuery.name] = {
								...customQuery,
								args: customArgs,
								type: isList ? new GraphQLList(graphQLType) : graphQLType,
								resolve: trace(resolvers.baseResolver(customQuery.resolver)),
								extensions: {
									directives: customQuery.directives ?? {},
								},
							};
						} else {
							const type: GraphQLOutputType = graphQLTypeForScalarEnumOrUnion(
								metadata,
								fieldType,
								entityFilter
							);

							fields[customQuery.name] = {
								...customQuery,
								args: customArgs,
								type: isList ? new GraphQLList(type) : type,
								resolve: trace(resolvers.baseResolver(customQuery.resolver)),
								extensions: {
									directives: customQuery.directives ?? {},
								},
							};
						}
					} catch (e) {
						safeErrorLog(logger, e);
						throw new Error(
							`Error while generating schema for custom query. Name: ${customQuery.name}, Type: ${String(customQuery.getType())}, Args: ${JSON.stringify(customQuery.args)}. Original Error: ${e}`
						);
					}
				}
				return fields;
			},
		});
	}

	private buildMutationType(entityFilter: EntityFilter | undefined) {
		const mutation = new GraphQLObjectType({
			name: 'Mutation',
			fields: () => {
				const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {};

				for (const entity of graphweaverMetadata.entities()) {
					// If the entityFilter says no, skip it.
					if (entityFilter && !entityFilter(entity)) continue;

					// If it's excluded from built-in operations, skip it.
					if (entity.apiOptions?.excludeFromBuiltInOperations) continue;
					if (entity.apiOptions?.excludeFromBuiltInWriteOperations) continue;

					// If this entity does not have a data provider, skip it.
					if (!entity.provider) continue;

					// Create One
					const createOneName = `create${entity.name}`;
					if (fields[createOneName]) {
						throw new Error(`Duplicate mutation name: ${createOneName}.`);
					}
					fields[createOneName] = {
						description: `Create a single ${entity.name}.`,
						type: graphQLTypeForEntity(entity, entityFilter),
						args: {
							input: { type: new GraphQLNonNull(insertTypeForEntity(entity, entityFilter)) },
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'createOne', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.createOrUpdate),
					};

					// Create Many
					const createManyName = `create${entity.plural}`;
					if (fields[createManyName]) {
						throw new Error(`Duplicate mutation name: ${createManyName}.`);
					}
					fields[createManyName] = {
						description: `Create many ${entity.plural}.`,
						type: new GraphQLList(graphQLTypeForEntity(entity, entityFilter)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(insertTypeForEntity(entity, entityFilter)))
								),
							},
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'createMany', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.createOrUpdate),
					};

					// Update One
					const updateOneName = `update${entity.name}`;
					if (fields[updateOneName]) {
						throw new Error(`Duplicate mutation name: ${updateOneName}.`);
					}
					fields[updateOneName] = {
						description: `Update a single ${entity.name}.`,
						type: graphQLTypeForEntity(entity, entityFilter),
						args: {
							input: { type: new GraphQLNonNull(updateTypeForEntity(entity, entityFilter)) },
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'updateOne', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.createOrUpdate),
					};

					// Update Many
					const updateManyName = `update${entity.plural}`;
					if (fields[updateManyName]) {
						throw new Error(`Duplicate mutation name: ${updateManyName}.`);
					}
					fields[updateManyName] = {
						description: `Update many ${entity.plural}.`,
						type: new GraphQLList(graphQLTypeForEntity(entity, entityFilter)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(updateTypeForEntity(entity, entityFilter)))
								),
							},
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'updateMany', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.createOrUpdate),
					};

					// Create or Update Many
					const createOrUpdateManyName = `createOrUpdate${entity.plural}`;
					if (fields[createOrUpdateManyName]) {
						throw new Error(`Duplicate mutation name: ${createOrUpdateManyName}.`);
					}
					fields[createOrUpdateManyName] = {
						description: `Create or update many ${entity.plural}.`,
						type: new GraphQLList(graphQLTypeForEntity(entity, entityFilter)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(
										new GraphQLNonNull(createOrUpdateTypeForEntity(entity, entityFilter))
									)
								),
							},
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'createOrUpdateMany', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.createOrUpdate),
					};

					// Delete One
					const deleteOneName = `delete${entity.name}`;
					if (fields[deleteOneName]) {
						throw new Error(`Duplicate mutation name: ${deleteOneName}.`);
					}
					fields[deleteOneName] = {
						description: `Delete a single ${entity.name}.`,
						type: GraphQLBoolean,
						args: {
							filter: {
								type: new GraphQLNonNull(deleteOneTypeForEntity(entity, entityFilter)),
							},
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'deleteOne', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.deleteOne),
					};

					// Delete Many
					const deleteManyName = `delete${entity.plural}`;
					if (fields[deleteManyName]) {
						throw new Error(`Duplicate mutation name: ${deleteManyName}.`);
					}
					fields[deleteManyName] = {
						description: `Delete many ${entity.plural} with a filter.`,
						type: GraphQLBoolean,
						args: {
							filter: { type: new GraphQLNonNull(filterTypeForEntity(entity, entityFilter)) },
						},
						extensions: {
							graphweaverSchemaInfo: { type: 'deleteMany', sourceEntity: entity },
						},
						resolve: resolvers.baseResolver(resolvers.deleteMany),
					};
				}

				// Add any user-defined additional mutations too
				for (const customMutation of graphweaverMetadata.additionalMutations()) {
					if (fields[customMutation.name]) {
						throw new Error(`Duplicate mutation name: ${customMutation.name}.`);
					}

					const { fieldType, isList, metadata } = getFieldTypeWithMetadata(customMutation.getType);
					const customArgs = this.graphQLTypeForArgs(entityFilter, customMutation.args);

					if (isEntityMetadata(metadata)) {
						// If the entity filter says no, we will ignore their custom mutation because it references
						// an entity that is filtered out of this schema.
						if (entityFilter && !entityFilter(metadata)) continue;

						// We're no longer checking for `excludeFromBuiltInOperations` here because this is
						// a user or system defined additional query, so by definition it needs to be included here.
						const graphQLType = graphQLTypeForEntity(metadata, entityFilter);

						fields[customMutation.name] = {
							...customMutation,
							args: customArgs,
							type: isList ? new GraphQLList(graphQLType) : graphQLType,
							resolve: trace(resolvers.baseResolver(customMutation.resolver)),
							extensions: {
								directives: customMutation.directives ?? {},
							},
						};
					} else {
						fields[customMutation.name] = {
							...customMutation,
							args: customArgs,
							type: graphQLScalarForTypeScriptType(fieldType),
							resolve: trace(resolvers.baseResolver(customMutation.resolver)),
							extensions: {
								directives: customMutation.directives ?? {},
							},
						};
					}
				}
				return fields;
			},
		});

		// Check that we have mutations to add to the schema.
		if (Object.keys(mutation.getFields()).length === 0) {
			return undefined;
		}

		return mutation;
	}

	private *buildDirectives(entityFilter: EntityFilter | undefined) {
		for (const directive of graphweaverMetadata.directives()) {
			const directiveType = new GraphQLDirective({
				name: directive.name,
				description: directive.description,
				locations: directive.locations,
				args: this.graphQLTypeForArgs(entityFilter, directive.args),
				isRepeatable: directive.isRepeatable,
			});

			yield directiveType;
		}
	}
}

export const SchemaBuilder = new SchemaBuilderImplementation();
