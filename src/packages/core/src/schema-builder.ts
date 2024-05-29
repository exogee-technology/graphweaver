import {
	GraphQLArgumentConfig,
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLEnumValueConfigMap,
	GraphQLFieldConfig,
	GraphQLFieldConfigArgumentMap,
	GraphQLFloat,
	GraphQLID,
	GraphQLInputFieldConfig,
	GraphQLInputObjectType,
	GraphQLInputType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLOutputType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	isListType,
	isNonNullType,
	isScalarType,
	printSchema,
	ThunkObjMap,
} from 'graphql';
import { ObjMap } from 'graphql/jsutils/ObjMap';
import { logger } from '@exogee/logger';

import {
	EntityMetadata,
	EnumMetadata,
	FieldMetadata,
	graphweaverMetadata,
	InputTypeMetadata,
	isEntityMetadata,
	isEnumMetadata,
	isInputMetadata,
	TypeValue,
} from '.';
import * as resolvers from './resolvers';

export const ID = GraphQLID;

const arrayOperations = new Set(['in', 'nin']);
const basicOperations = new Set(['ne', 'notnull', 'null']);
const likeOperations = new Set(['like', 'ilike']);
const mathOperations = new Set(['gt', 'gte', 'lt', 'lte']);
const allOperations = new Set([
	...arrayOperations,
	...basicOperations,
	...likeOperations,
	...mathOperations,
]);

const entityTypes = new Map<string, GraphQLObjectType>();
const inputTypes = new Map<string, GraphQLInputObjectType>();
const enumTypes = new Map<string, GraphQLEnumType>();
const filterTypes = new Map<string, GraphQLInputObjectType>();
const insertTypes = new Map<string, GraphQLInputObjectType>();
const updateTypes = new Map<string, GraphQLInputObjectType>();
const createOrUpdateTypes = new Map<string, GraphQLInputObjectType>();
const paginationTypes = new Map<string, GraphQLInputObjectType>();

const scalarShouldGetLikeOperations = (scalar: GraphQLScalarType) => scalar === GraphQLString;
const scalarShouldGetMathOperations = (
	scalar: GraphQLScalarType | NumberConstructor | DateConstructor | BigIntConstructor
) => scalar === Number || scalar === Date || scalar === BigInt || scalar.name === 'ISOString';

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

// All entities are deleted by primary key, so we only need one of these.
const deleteInput = new GraphQLInputObjectType({
	name: 'DeleteOneFilterInput',
	fields: {
		id: { type: new GraphQLNonNull(ID) },
	},
});

export const getFieldTypeFromFieldMetadata = (
	field: FieldMetadata<any, any>
): {
	fieldType: TypeValue;
	isList: boolean;
	metadata?: EnumMetadata<any> | EntityMetadata<any, any> | InputTypeMetadata<any, any>;
} => {
	let fieldType = field.getType();
	let isList = false;
	if (Array.isArray(fieldType)) {
		isList = true;
		fieldType = fieldType[0];
	}
	const metadata = graphweaverMetadata.metadataForType(fieldType);

	return { fieldType, isList, metadata };
};

const getFieldType = (field: FieldMetadata<any, any>): TypeValue => {
	const unwrapType = (type: TypeValue): TypeValue => {
		if (isListType(type) || isNonNullType(type)) {
			return unwrapType(type.ofType);
		}
		if (isGraphQLScalarForTypeScriptType(type)) {
			return graphQLScalarForTypeScriptType(type);
		}
		return type;
	};

	return unwrapType(field.getType());
};

const isGraphQLScalarForTypeScriptType = (type: TypeValue): type is GraphQLScalarType => {
	switch (type) {
		case String:
		case Number:
		case Boolean:
			return true;
		default:
			return false;
	}
};

const graphQLScalarForTypeScriptType = (type: TypeValue): GraphQLScalarType => {
	if (isScalarType(type)) return type;

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

const graphQLTypeForInput = (input: InputTypeMetadata<any, any>) => {
	let inputType = inputTypes.get(input.name);

	if (!inputType) {
		inputType = new GraphQLInputObjectType({
			name: input.name,
			description: input.description,
			fields: () => {
				const fields: ObjMap<GraphQLInputFieldConfig> = {};

				for (const field of Object.values(input.fields)) {
					// Let's try to resolve the GraphQL type involved here.
					const { fieldType, isList, metadata } = getFieldTypeFromFieldMetadata(field);
					let graphQLType: GraphQLInputType | undefined = undefined;

					if (isInputMetadata(metadata)) {
						graphQLType = graphQLTypeForInput(metadata);
					} else if (isEnumMetadata(metadata)) {
						graphQLType = graphQLTypeForEnum(metadata);
					} else {
						// Ok, it's some kind of in-built scalar we need to map.
						const scalar = graphQLScalarForTypeScriptType(fieldType);

						if (!scalar) {
							throw new Error(
								`Could not map field ${field.name} on entity ${input.name} of type ${String(field.getType())} to a GraphQL scalar.`
							);
						}

						graphQLType = scalar;
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
				}

				return fields;
			},
		});
	}

	inputTypes.set(input.name, inputType);

	return inputType;
};

// This is exported because deep within the create or update logic we need to stub a GraphQLResolveInfo object.
// It's not meant to be used as a public API, please use the SchemaBuilder export unless you have a good reason not to.
export const graphQLTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let entityType = entityTypes.get(entity.name);

	if (!entityType) {
		entityType = new GraphQLObjectType({
			name: entity.name,
			description: entity.description,
			fields: () => {
				const fields: ObjMap<GraphQLFieldConfig<unknown, unknown>> = {};

				for (const field of Object.values(entity.fields)) {
					// Let's try to resolve the GraphQL type involved here.
					const { fieldType, isList, metadata } = getFieldTypeFromFieldMetadata(field);
					let graphQLType: GraphQLOutputType | undefined = undefined;
					let resolve = undefined;
					const args: ObjMap<GraphQLArgumentConfig> = {};

					if (isEntityMetadata(metadata)) {
						graphQLType = graphQLTypeForEntity(metadata);

						if (metadata.provider) {
							resolve = resolvers.baseResolver(resolvers.listRelationshipField);

							args['filter'] = {
								type: filterTypeForEntity(metadata),
							};
						}
					} else if (isEnumMetadata(metadata)) {
						graphQLType = graphQLTypeForEnum(metadata);
					} else {
						// Ok, it's some kind of in-built scalar we need to map.
						const scalar = graphQLScalarForTypeScriptType(fieldType);

						if (!scalar) {
							throw new Error(
								`Could not map field ${field.name} on entity ${entity.name} of type ${String(field.getType())} to a GraphQL scalar.`
							);
						}

						graphQLType = scalar;
					}

					// If it's an array, wrap it in a list and make it not nullable within the list.
					if (isList) {
						graphQLType = new GraphQLList(new GraphQLNonNull(graphQLType));
					}

					// And finally, if it's not marked as nullable, wrap whatever it is in Non Null.
					if (!field.nullable) {
						graphQLType = new GraphQLNonNull(graphQLType);
					}

					fields[field.name] = {
						type: graphQLType,
						args,
						// Typecast should not be required here as we know the context object, but this will get us building.
						resolve: resolve as any,
					};
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

				for (const field of Object.values(entity.fields)) {
					const fieldType = getFieldType(field);
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

		paginationTypes.set(entity.name, paginationType);
	}

	return paginationType;
};

const generateGraphQLInputFieldsForEntity =
	(entity: EntityMetadata<any, any>, input: 'insert' | 'update' | 'createOrUpdate') => () => {
		const fields: ObjMap<GraphQLInputFieldConfig> = {};
		for (const field of Object.values(entity.fields)) {
			// If it's excluded from built-in write operations, skip it.
			if (field.apiOptions?.excludeFromBuiltInWriteOperations) continue;

			// The ID field is a special case based on the input type.
			if (field.name === (entity.primaryKeyField ?? 'id')) {
				switch (input) {
					case 'createOrUpdate':
						fields[field.name] = { type: ID };
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
			const { fieldType, metadata, isList } = getFieldTypeFromFieldMetadata(field);

			if (isEntityMetadata(metadata)) {
				// This if is separate to stop us cascading down to the scalar branch for entities that
				if (
					!metadata.apiOptions?.excludeFromBuiltInOperations &&
					!metadata.apiOptions?.excludeFromBuiltInWriteOperations
				) {
					let type: GraphQLInputType = createOrUpdateTypeForEntity(metadata);

					if (isList) {
						// If it's a many relationship we need to wrap in non-null and list.
						type = new GraphQLList(new GraphQLNonNull(type));
					}

					fields[field.name] = { type };
				}
			} else if (isEnumMetadata(metadata)) {
				fields[field.name] = { type: graphQLTypeForEnum(metadata) };
			} else {
				fields[field.name] = { type: graphQLScalarForTypeScriptType(fieldType) };
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

const insertTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let insertType = insertTypes.get(entity.name);

	if (!insertType) {
		insertType = new GraphQLInputObjectType({
			name: `${entity.name}InsertInput`,
			description: `Data needed to create ${entity.plural}.`,
			fields: generateGraphQLInputFieldsForEntity(entity, 'insert'),
		});

		insertTypes.set(entity.name, insertType);
	}

	return insertType;
};

const createOrUpdateTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let createOrUpdateType = createOrUpdateTypes.get(entity.name);

	if (!createOrUpdateType) {
		const primaryKeyFieldName = graphweaverMetadata.primaryKeyFieldForEntity(entity);

		createOrUpdateType = new GraphQLInputObjectType({
			name: `${entity.name}CreateOrUpdateInput`,
			description: `Data needed to create or update ${entity.plural}. If an ID is passed, this is an update, otherwise it's an insert.`,
			fields: generateGraphQLInputFieldsForEntity(entity, 'createOrUpdate'),
		});

		createOrUpdateTypes.set(entity.name, createOrUpdateType);
	}

	return createOrUpdateType;
};

const updateTypeForEntity = (entity: EntityMetadata<any, any>) => {
	let updateType = updateTypes.get(entity.name);

	if (!updateType) {
		const primaryKeyFieldName = graphweaverMetadata.primaryKeyFieldForEntity(entity);

		updateType = new GraphQLInputObjectType({
			name: `${entity.name}UpdateInput`,
			description: `Data needed to update ${entity.plural}. An ID must be passed.`,
			fields: generateGraphQLInputFieldsForEntity(entity, 'update'),
		});

		updateTypes.set(entity.name, updateType);
	}

	return updateType;
};

export interface SchemaBuilderOptions {}

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

	public isValidFilterOperation(filterOperation: string) {
		return allOperations.has(filterOperation);
	}

	private *buildTypes() {
		for (const entity of graphweaverMetadata.entities()) {
			// The core entity object type
			yield graphQLTypeForEntity(entity);

			if (
				!entity.apiOptions?.excludeFromBuiltInOperations &&
				!entity.apiOptions?.excludeFromFiltering
			) {
				// The input type for filtering
				yield filterTypeForEntity(entity);
			}

			if (
				!entity.apiOptions?.excludeFromBuiltInOperations &&
				!entity.apiOptions?.excludeFromBuiltInWriteOperations
			) {
				// The input type for inserting
				yield insertTypeForEntity(entity);

				// The input type for inserting
				yield updateTypeForEntity(entity);

				// The input type for creating or updating
				yield createOrUpdateTypeForEntity(entity);
			}

			// The input type for pagination and sorting
			// This is only emitted if the entity has a provider, as it's only used for querying.
			if (entity.provider) {
				yield paginationTypeForEntity(entity);
			}
		}

		// Also emit all our input types.
		for (const input of graphweaverMetadata.inputTypes()) {
			yield graphQLTypeForInput(input);
		}

		// Also emit all our enums.
		for (const enumType of graphweaverMetadata.enums()) {
			yield graphQLTypeForEnum(enumType);
		}
	}

	private graphQLTypeForArgs(args?: Record<string, unknown>): GraphQLFieldConfigArgumentMap {
		const map: GraphQLFieldConfigArgumentMap = {};
		if (!args) return map;

		for (const [name, type] of Object.entries(args)) {
			const metadata = graphweaverMetadata.metadataForType(type);

			let inputType: GraphQLInputType;
			if (isInputMetadata(metadata)) {
				inputType = new GraphQLNonNull(graphQLTypeForInput(metadata));
			} else if (isEnumMetadata(type)) {
				inputType = graphQLTypeForEnum(type);
			} else {
				inputType = graphQLScalarForTypeScriptType(type as TypeValue);
			}
			map[name] = { type: inputType };
		}

		return map;
	}

	private buildQueryType(args?: SchemaBuilderOptions) {
		return new GraphQLObjectType({
			name: 'Query',
			fields: () => {
				const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {};

				for (const entity of graphweaverMetadata.entities()) {
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
						type: graphQLTypeForEntity(entity),
						args: {
							id: { type: new GraphQLNonNull(ID) },
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
						type: new GraphQLList(graphQLTypeForEntity(entity)),
						args: {
							filter: { type: filterTypeForEntity(entity) },
							...(entity.provider ? { pagination: { type: paginationTypeForEntity(entity) } } : {}),
						},
						resolve: resolvers.baseResolver(resolvers.list),
					};
				}

				// Add any user-defined additional queries too
				for (const customQuery of graphweaverMetadata.additionalQueries()) {
					if (fields[customQuery.name]) {
						throw new Error(`Duplicate query name: ${customQuery.name}.`);
					}

					const type = customQuery.getType();
					const metadata = graphweaverMetadata.metadataForType(type);
					const customArgs = this.graphQLTypeForArgs(customQuery.args);

					if (isEntityMetadata(metadata)) {
						// We're no longer checking for `excludeFromBuiltInOperations` here because this is
						// a user or system defined additional query, so by definition it needs to be included here.
						fields[customQuery.name] = {
							...customQuery,
							args: customArgs,
							type: graphQLTypeForEntity(metadata),
							resolve: resolvers.baseResolver(customQuery.resolver),
						};
					} else {
						fields[customQuery.name] = {
							...customQuery,
							args: customArgs,
							type: graphQLScalarForTypeScriptType(type),
							resolve: resolvers.baseResolver(customQuery.resolver),
						};
					}
				}
				return fields;
			},
		});
	}

	private buildMutationType(args?: SchemaBuilderOptions) {
		return new GraphQLObjectType({
			name: 'Mutation',
			fields: () => {
				const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {};

				for (const entity of graphweaverMetadata.entities()) {
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
						type: graphQLTypeForEntity(entity),
						args: {
							input: { type: new GraphQLNonNull(insertTypeForEntity(entity)) },
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
						type: new GraphQLList(graphQLTypeForEntity(entity)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(insertTypeForEntity(entity)))
								),
							},
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
						type: graphQLTypeForEntity(entity),
						args: {
							input: { type: new GraphQLNonNull(updateTypeForEntity(entity)) },
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
						type: new GraphQLList(graphQLTypeForEntity(entity)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(updateTypeForEntity(entity)))
								),
							},
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
						type: new GraphQLList(graphQLTypeForEntity(entity)),
						args: {
							input: {
								type: new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(createOrUpdateTypeForEntity(entity)))
								),
							},
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
								type: new GraphQLNonNull(deleteInput),
							},
						},
						resolve: resolvers.baseResolver(resolvers.deleteOne(entity)),
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
							filter: { type: new GraphQLNonNull(filterTypeForEntity(entity)) },
						},
						resolve: resolvers.baseResolver(resolvers.deleteMany(entity)),
					};
				}

				// Add any user-defined additional mutations too
				for (const customMutation of graphweaverMetadata.additionalMutations()) {
					if (fields[customMutation.name]) {
						throw new Error(`Duplicate mutation name: ${customMutation.name}.`);
					}

					const type = customMutation.getType();
					const metadata = graphweaverMetadata.metadataForType(type);
					const customArgs = this.graphQLTypeForArgs(customMutation.args);

					if (isEntityMetadata(metadata)) {
						// We're no longer checking for `excludeFromBuiltInOperations` here because this is
						// a user or system defined additional query, so by definition it needs to be included here.
						fields[customMutation.name] = {
							...customMutation,
							args: customArgs,
							type: graphQLTypeForEntity(metadata),
							resolve: resolvers.baseResolver(customMutation.resolver),
						};
					} else {
						fields[customMutation.name] = {
							...customMutation,
							args: customArgs,
							type: graphQLScalarForTypeScriptType(type),
							resolve: resolvers.baseResolver(customMutation.resolver),
						};
					}
				}
				return fields;
			},
		});
	}
}

export const SchemaBuilder = new SchemaBuilderImplementation();
