import { GraphQLResolveInfo, Source, isListType, isObjectType } from 'graphql';
import { logger } from '@exogee/logger';
import { ResolveTree, parseResolveInfo } from 'graphql-parse-resolve-info';

import { BaseContext } from './types';
import {
	AggregationResult,
	AggregationType,
	BaseLoaders,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	DeleteManyHookParams,
	EntityMetadata,
	FieldMetadata,
	Filter,
	HookRegister,
	ReadHookParams,
	Resolver,
	ResolverOptions,
	createOrUpdateEntities,
	getFieldTypeWithMetadata,
	graphweaverMetadata,
	hookManagerMap,
	isEntityMetadata,
	isTransformableGraphQLEntityClass,
} from '.';
import { Trace, traceSync, trace } from './open-telemetry';
import { QueryManager } from './query-manager';
import { applyDefaultValues, hasId, withTransaction } from './utils';
import { dataEntityForGraphQLEntity, fromBackendEntity } from './default-from-backend-entity';

type ID = string | number | bigint;

export const baseResolver = (resolver: Resolver) => {
	return async (
		source: Source,
		args: any,
		context: BaseContext,
		info: GraphQLResolveInfo,
		trace?: Trace
	) => {
		trace?.span.updateName(`Resolver - BaseResolver`);
		return resolver({
			args,
			context,
			fields: (parseResolveInfo(info) ?? {}) as ResolveTree,
			info,
			source,
		});
	};
};

const _getOne = async <G>(
	{ args: { id }, context, fields, info }: ResolverOptions,
	trace?: Trace
) => {
	logger.trace({ id, context, info }, 'Get One resolver called.');

	if (!isObjectType(info.returnType)) {
		throw new Error('Graphweaver getOne resolver can only be used to return single objects.');
	}

	const entity = (info.returnType.extensions.graphweaverSchemaInfo as any)
		?.sourceEntity as EntityMetadata<any, any>;

	if (!entity) {
		throw new Error(
			`GraphQL type ${info.returnType} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	trace?.span.updateName(`Resolver - GetOne ${entity.name}`);

	if (!entity.provider) {
		throw new Error(`Entity ${entity.name} does not have a provider, cannot resolve.`);
	}

	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity);
	const hookManager = hookManagerMap.get(entity.name);

	const params: ReadHookParams<G> = {
		args: { filter: { [primaryKeyField]: id } as Filter<G> },
		context,
		fields,
		transactional: !!entity.provider.withTransaction,
	};

	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	if (!hookParams.args?.filter) throw new Error('No find filter specified cannot continue.');

	let result = await entity.provider.findOne(hookParams.args.filter);

	result = fromBackendEntity(entity, result);

	// If a hook manager is installed, run the after read hooks for this operation.
	if (hookManager) {
		const { entities } = await hookManager.runHooks(HookRegister.AFTER_READ, {
			...hookParams,
			entities: [result],
		});
		result = entities[0];
	}

	// And finally return whatever we have at this point.
	return result;
};

const _list = async <G, D>(
	{ args: { filter, pagination }, context, info, fields }: ResolverOptions,
	trace?: Trace
) => {
	logger.trace({ filter, pagination, context, info }, 'List resolver called.');

	if (!isListType(info.returnType)) {
		throw new Error('Graphweaver list resolver can only be used to return list types.');
	}

	if (!isObjectType(info.returnType.ofType)) {
		throw new Error('Graphweaver list resolver can only be used to return lists of objects.');
	}

	const entity = (info.returnType.ofType.extensions.graphweaverSchemaInfo as any)
		?.sourceEntity as EntityMetadata<any, any>;

	if (!entity) {
		throw new Error(
			`GraphQL type ${info.returnType.ofType} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	trace?.span.updateName(`Resolver - List ${entity.name}`);

	if (!entity.provider) {
		throw new Error(
			`Entity ${entity.name} does not have a provider, cannot resolve list operation.`
		);
	}

	const hookManager = hookManagerMap.get(entity.name);
	const params: ReadHookParams<G> = {
		args: { filter, pagination },
		context,
		fields,
		transactional: !!entity.provider.withTransaction,
	};
	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	const transformedFilter =
		hookParams.args?.filter &&
		isTransformableGraphQLEntityClass(entity.target) &&
		entity.target.toBackendEntityFilter
			? entity.target.toBackendEntityFilter(hookParams.args?.filter)
			: (hookParams.args?.filter as Filter<D> | undefined);

	let result = await QueryManager.find<D>({
		entityName: entity.name,
		filter: transformedFilter,
		pagination: hookParams.args?.pagination,
	});
	logger.trace({ result }, 'Got result');

	result = traceSync<[], (G | null)[]>((trace?: Trace) => {
		trace?.span.updateName(
			`FromBackendEntity - ${result.length} ${entity.name} ${result.length > 1 ? 'entities' : 'entity'}`
		);
		return result.map((resultRow) => fromBackendEntity(entity, resultRow));
	})();

	// If a hook manager is installed, run the after read hooks for this operation.
	if (hookManager) {
		const { entities } = await hookManager.runHooks(HookRegister.AFTER_READ, {
			...hookParams,
			entities: result,
		});
		result = entities;
	}

	// And finally return whatever we have at this point.
	return result;
};

const _createOrUpdate = async <G, D>(
	{ args: { input }, context, info, fields }: ResolverOptions<{ input: Partial<G> | Partial<G>[] }>,
	trace?: Trace
) => {
	logger.trace({ input, context, info }, 'Create or Update resolver called.');

	let graphQLType;

	if (isObjectType(info.returnType)) {
		graphQLType = info.returnType;
	} else if (isListType(info.returnType) && isObjectType(info.returnType.ofType)) {
		graphQLType = info.returnType.ofType;
	} else {
		throw new Error('Could not determine entity name from return type.');
	}

	const entity = (graphQLType.extensions.graphweaverSchemaInfo as any)
		?.sourceEntity as EntityMetadata<any, any>;

	if (!entity) {
		throw new Error(
			`GraphQL type ${graphQLType} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	trace?.span.updateName(`Resolver - CreateOrUpdate ${entity.name}`);

	if (!entity.provider) {
		throw new Error(
			`Entity ${entity.name} does not have a provider, cannot resolve create or update operation.`
		);
	}

	// Ok, now let's apply our default values to the data.
	applyDefaultValues(input, entity);

	const inputArray = Array.isArray(input) ? input : [input];

	return withTransaction(entity.provider, async () => {
		// Extracted common properties
		const hookManager = hookManagerMap.get(entity.name);
		const commonParams: Omit<CreateOrUpdateHookParams<G>, 'args'> = {
			context,
			fields,
			transactional: !!entity.provider?.withTransaction,
		};

		// Separate Create and Update items
		const updateItems: Partial<G>[] = [];
		const createItems: Partial<G>[] = [];
		for (const item of inputArray) {
			if (hasId(entity, item)) {
				updateItems.push(item);
			} else {
				createItems.push(item);
			}
		}

		// Extract ids of items being updated
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof G;
		const updateItemIds = updateItems.map((item) => item[primaryKeyField as keyof typeof item]);

		// Prepare updateParams and run hook if needed
		const updateParams: CreateOrUpdateHookParams<G> = {
			args: { items: updateItems },
			...commonParams,
		};
		const updateHookParams =
			updateItems.length && hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_UPDATE, updateParams)
				: updateParams;

		// Prepare createParams and run hook if needed
		const createParams: CreateOrUpdateHookParams<G> = {
			args: { items: createItems },
			...commonParams,
		};
		const createHookParams =
			createItems.length && hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_CREATE, createParams)
				: createParams;

		// Combine update and create items into a single array
		const data = [...(updateHookParams.args?.items ?? []), ...(createHookParams.args?.items ?? [])];

		const entities = (await createOrUpdateEntities(data, entity, info, context)) as G[];

		// Filter update and create entities
		let updatedEntities = entities.filter(
			(entity) => entity && updateItemIds.includes(entity[primaryKeyField])
		);
		let createdEntities = entities.filter(
			(entity) => entity && !updateItemIds.includes(entity[primaryKeyField])
		);

		// Run after hooks for update and create entities
		if (hookManager) {
			createdEntities = (
				await hookManager.runHooks(HookRegister.AFTER_CREATE, {
					...createHookParams,
					entities: createdEntities,
				})
			).entities;

			updatedEntities = (
				await hookManager.runHooks(HookRegister.AFTER_UPDATE, {
					...updateHookParams,
					entities: updatedEntities,
				})
			).entities;
		}

		// Return combined results if it's a multi update, otherwise just one.
		if (isListType(info.returnType)) return [...createdEntities, ...updatedEntities];
		else return createdEntities[0] ?? updatedEntities[0];
	});
};

const _deleteOne = async <G extends { name: string }>(
	{ args: { filter }, info, context, fields }: ResolverOptions<{ filter: Filter<G> }>,
	trace?: Trace
) => {
	const field = info.schema.getMutationType()?.getFields()[info.fieldName];
	if (!field) {
		throw new Error(`Could not find field ${info.fieldName} in mutation type.`);
	}

	const entity = (field.extensions.graphweaverSchemaInfo as any).sourceEntity as EntityMetadata<
		any,
		any
	>;

	if (!entity) {
		throw new Error(
			`GraphQL mutation field ${info.fieldName} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	trace?.span.updateName(`Resolver - DeleteOne ${entity.name}`);

	if (!entity.provider) {
		throw new Error(
			`Entity ${entity.name} does not have a provider, cannot resolve delete operation.`
		);
	}

	const hookManager = hookManagerMap.get(entity.name);
	const params: DeleteHookParams<G> = {
		args: { filter },
		context,
		fields,
		transactional: false,
	};

	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_DELETE, params)
		: params;

	if (!hookParams.args?.filter) throw new Error('No delete filter specified cannot continue.');

	const success = await entity.provider.deleteOne(hookParams.args.filter);

	hookManager &&
		(await hookManager.runHooks(HookRegister.AFTER_DELETE, {
			...hookParams,
			deleted: success,
		}));

	return success;
};

const _deleteMany = async <G>(
	{ args: { filter }, context, info, fields }: ResolverOptions<{ filter: Filter<G> }>,
	trace?: Trace
) => {
	const field = info.schema.getMutationType()?.getFields()[info.fieldName];
	if (!field) {
		throw new Error(`Could not find field ${info.fieldName} in mutation type.`);
	}

	const entity = (field.extensions.graphweaverSchemaInfo as any).sourceEntity as EntityMetadata<
		any,
		any
	>;

	if (!entity) {
		throw new Error(
			`GraphQL mutation field ${info.fieldName} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	trace?.span.updateName(`Resolver - DeleteMany ${entity.name}`);
	if (!entity.provider) {
		throw new Error(
			`Entity ${entity.name} does not have a provider, cannot resolve delete operation.`
		);
	}
	return withTransaction(entity.provider, async () => {
		if (!entity.provider?.deleteMany) throw new Error('Provider has not implemented DeleteMany.');

		const hookManager = hookManagerMap.get(entity.name);
		const params: DeleteManyHookParams<G> = {
			args: { filter },
			context,
			fields,
			transactional: !!entity.provider.withTransaction,
		};

		const hookParams = hookManager
			? await hookManager.runHooks(HookRegister.BEFORE_DELETE, params)
			: params;

		if (!hookParams.args?.filter) throw new Error('No delete ids specified cannot continue.');

		const success = await entity.provider.deleteMany(hookParams.args?.filter);

		hookManager &&
			(await hookManager.runHooks(HookRegister.AFTER_DELETE, {
				...hookParams,
				deleted: success,
			}));

		return success;
	});
};

// This is a function generator where you can bind it to the correct entity when creating it, as we cannot look up the entity name / type from the info object.
const _aggregate = async <G extends { name: string }>(
	{ args: { filter }, context, info, fields }: ResolverOptions<{ filter: Filter<G> }>,
	trace?: Trace
) => {
	const field = info.schema.getQueryType()?.getFields()[info.fieldName];
	if (!field) {
		throw new Error(`Could not find field ${info.fieldName} in mutation type.`);
	}

	const entity = (field.extensions.graphweaverSchemaInfo as any).sourceEntity as EntityMetadata<
		any,
		any
	>;

	if (!entity) {
		throw new Error(
			`GraphQL mutation field ${info.fieldName} could not be mapped back to a source entity via graphweaverSchemaInfo extension.`
		);
	}

	if (!entity.provider) {
		throw new Error(
			`Entity ${entity.name} does not have a provider, cannot resolve aggregate operation.`
		);
	}

	if (!entity.provider.aggregate) {
		throw new Error('Provider has not implemented aggregate, cannot resolve aggregate operation.');
	}

	trace?.span.updateName(`Resolver - Aggregate ${entity.name}`);

	const requestedFields =
		fields.fieldsByTypeName[
			graphweaverMetadata.federationNameForGraphQLTypeName('AggregationResult')
		];
	const requestedAggregations = new Set<AggregationType>();
	if (requestedFields.count) requestedAggregations.add(AggregationType.COUNT);

	const hookManager = hookManagerMap.get(entity.name);
	const params: ReadHookParams<G> = {
		args: { filter },
		context,
		fields,
		transactional: !!entity.provider.withTransaction,
	};
	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	const transformedFilter =
		hookParams.args?.filter &&
		isTransformableGraphQLEntityClass(entity.target) &&
		entity.target.toBackendEntityFilter
			? entity.target.toBackendEntityFilter(hookParams.args?.filter)
			: (hookParams.args?.filter as Filter<any> | undefined);

	const flattenedFilter = await QueryManager.flattenFilter<any>({
		entityName: entity.name,
		filter: transformedFilter,
	});

	const success = await entity.provider.aggregate(flattenedFilter, requestedAggregations);

	// If a hook manager is installed, run the after read hooks for this operation.
	// We don't actually have any entities to pass to the hook, so we'll just pass an empty array.
	if (hookManager) {
		await hookManager.runHooks(HookRegister.AFTER_READ, {
			...hookParams,
			entities: [],
		});
	}

	return success;
};

const _listRelationshipField = async <G, D, R, C extends BaseContext>(
	{ source, args: { filter }, context, fields, info }: ResolverOptions<{ filter: Filter<R> }, C, G>,
	trace?: Trace
) => {
	trace?.span.updateName(
		`Resolver - ListRelationshipField ${info.path.typename} - ${info.fieldName}`
	);
	logger.trace(`Resolving ${info.parentType.name}.${info.fieldName}`);

	if (!info.path.typename)
		throw new Error(`No typename found in path for ${info.path}, this should not happen.`);

	const entity = graphweaverMetadata.getEntityByName(info.path.typename);
	if (!entity) {
		throw new Error(`Entity ${info.path.typename} not found in metadata. This should not happen.`);
	}

	// If we've already resolved the data, we may want to return it, but we want the hooks to run first.
	const existingData = source[info.fieldName as keyof G];

	const field = entity.fields[info.fieldName];
	const { id, relatedField } = field.relationshipInfo ?? {};

	let idValue: ID | undefined = undefined;
	if (id && typeof id === 'function') {
		// If the id is a function, we'll call it with the source data to get the id value.
		idValue = id(dataEntityForGraphQLEntity<G, D>(source as any));
	} else if (id) {
		// else if the id is a string, we'll try to get the value from the source data.
		const valueOfForeignKey = dataEntityForGraphQLEntity<G, D>(source as any)?.[id as keyof D];

		// If the value is a string or number, we'll use it as the id value.
		if (
			typeof valueOfForeignKey === 'string' ||
			typeof valueOfForeignKey === 'number' ||
			typeof valueOfForeignKey === 'bigint'
		) {
			idValue = valueOfForeignKey;
		} else {
			// The ID value must be a string or a number otherwise we'll throw an error.
			throw new Error(
				'Could not determine id value for relationship field only string or numbers are supported.'
			);
		}
	}

	if (typeof existingData === 'undefined' && !idValue && !field.relationshipInfo?.relatedField) {
		// id is null and we are loading a single instance so let's return null
		return null;
	}

	const { fieldType, isList } = getFieldTypeWithMetadata(field.getType);
	const gqlEntityType = fieldType as { new (...args: any[]): R };

	const relatedEntityMetadata = graphweaverMetadata.metadataForType(gqlEntityType);
	if (!isEntityMetadata(relatedEntityMetadata)) {
		throw new Error(`Related entity ${gqlEntityType.name} not found in metadata or not an entity.`);
	}
	const sourcePrimaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof G;
	const relatedPrimaryKeyField =
		graphweaverMetadata.primaryKeyFieldForEntity(relatedEntityMetadata);

	// We need to construct a filter for the related entity and _and it with the user supplied filter.
	const _and: Filter<R>[] = [];

	// If we have a user supplied filter, add it to the _and array.
	if (filter) _and.push(filter);

	// Lets check the relationship type and add the appropriate filter.
	if (idValue) {
		_and.push({ [relatedPrimaryKeyField]: idValue } as Filter<R>);
	} else if (relatedField) {
		_and.push({
			[relatedField]: { [sourcePrimaryKeyField]: source[sourcePrimaryKeyField] },
		} as Filter<R>);
	}

	const relatedEntityFilter = { _and } as Filter<R>;

	const params: ReadHookParams<R> = {
		args: { filter: relatedEntityFilter },
		context,
		fields,
		transactional: !!entity.provider?.withTransaction,
	};
	const hookManager = hookManagerMap.get(gqlEntityType.name);
	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	// Ok, now we've run our hooks and validated permissions, let's first check if we already have the data.
	logger.trace('Checking for existing data.');

	if (typeof existingData !== 'undefined') {
		logger.trace({ existingData }, 'Existing data found, returning.');

		const entities = [existingData].flat();

		logger.trace('Running after read hooks');
		const { entities: hookEntities = [] } = hookManager
			? await hookManager.runHooks(HookRegister.AFTER_READ, {
					...hookParams,
					entities,
				})
			: { entities };

		logger.trace({ before: existingData, after: hookEntities }, 'After read hooks ran');

		return isList ? hookEntities : hookEntities[0];
	}

	logger.trace('Existing data not found. Loading from BaseLoaders');

	let dataEntities: D[] | undefined = undefined;
	if (field.relationshipInfo?.relatedField) {
		logger.trace('Loading with loadByRelatedId');

		// This should be typed as <gqlEntityType, relatedEntityType>
		dataEntities = await BaseLoaders.loadByRelatedId<R, D>({
			gqlEntityType,
			relatedField: field.relationshipInfo.relatedField as keyof D & string,
			id: String(source[sourcePrimaryKeyField]),
			filter: relatedEntityFilter as Filter<typeof gqlEntityType>,
		});
	} else if (idValue) {
		logger.trace('Loading with loadOne');

		const dataEntity = await BaseLoaders.loadOne<R, D>({
			gqlEntityType,
			id: String(idValue),
		});
		dataEntities = [dataEntity];
	}

	const entities = (dataEntities ?? []).map((dataEntity) =>
		fromBackendEntity(relatedEntityMetadata, dataEntity)
	);

	logger.trace('Running after read hooks');
	const { entities: hookEntities = [] } = hookManager
		? await hookManager.runHooks(HookRegister.AFTER_READ, {
				...hookParams,
				entities,
			})
		: { entities };

	logger.trace({ before: entities, after: hookEntities }, 'After read hooks ran');

	if (isList) {
		return hookEntities;
	} else {
		return hookEntities[0];
	}
};

// This is a function generator where you can bind it to the correct entity when creating it, as we cannot look up the entity name / type from the info object.
export const aggregateRelationshipField = (
	parentEntity: EntityMetadata<any, any>,
	field: FieldMetadata
) =>
	trace(
		async <G, D, R, C extends BaseContext>(
			{ args: { filter }, context, source, fields }: ResolverOptions<{ filter: Filter<R> }, C, G>,
			trace?: Trace
		): Promise<AggregationResult> => {
			logger.trace('Resolving aggregated relationship field');

			const requestedFields =
				fields.fieldsByTypeName[
					graphweaverMetadata.federationNameForGraphQLTypeName('AggregationResult')
				];
			const requestedAggregations = new Set<AggregationType>();
			if (requestedFields.count) requestedAggregations.add(AggregationType.COUNT);

			logger.trace(requestedAggregations, 'Requested aggregations');

			if (requestedAggregations.size === 0) {
				logger.trace(requestedAggregations, 'No requested aggregations, returning.');
				return {};
			}

			trace?.span.updateName(
				`Resolver - AggregateRelationshipField ${parentEntity.name}.${field.name}`
			);

			const { id, relatedField } = field.relationshipInfo ?? {};

			let idValue: ID | undefined = undefined;
			if (id && typeof id === 'function') {
				// If the id is a function, we'll call it with the source data to get the id value.
				idValue = id(dataEntityForGraphQLEntity<G, D>(source as any));
			} else if (id) {
				// else if the id is a string, we'll try to get the value from the source data.
				const valueOfForeignKey = dataEntityForGraphQLEntity<G, D>(source as any)?.[id as keyof D];

				// If the value is a string or number, we'll use it as the id value.
				if (
					typeof valueOfForeignKey === 'string' ||
					typeof valueOfForeignKey === 'number' ||
					typeof valueOfForeignKey === 'bigint'
				) {
					idValue = valueOfForeignKey;
				} else {
					// The ID value must be a string or a number otherwise we'll throw an error.
					throw new Error(
						'Could not determine id value for relationship field only string or numbers are supported.'
					);
				}
			}

			const { fieldType } = getFieldTypeWithMetadata(field.getType);
			const gqlEntityType = fieldType as { new (...args: any[]): R };

			const relatedEntityMetadata = graphweaverMetadata.metadataForType(gqlEntityType);
			if (!isEntityMetadata(relatedEntityMetadata)) {
				throw new Error(
					`Related entity ${gqlEntityType.name} not found in metadata or not an entity.`
				);
			}
			const sourcePrimaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(
				parentEntity
			) as keyof G;
			const relatedPrimaryKeyField =
				graphweaverMetadata.primaryKeyFieldForEntity(relatedEntityMetadata);

			// We need to construct a filter for the related entity and _and it with the user supplied filter.
			const _and: Filter<R>[] = [];

			// If we have a user supplied filter, add it to the _and array.
			if (filter) _and.push(filter);

			// Lets check the relationship type and add the appropriate filter.
			if (idValue) {
				_and.push({ [relatedPrimaryKeyField]: idValue } as Filter<R>);
			} else if (relatedField) {
				_and.push({
					[relatedField]: { [sourcePrimaryKeyField]: source[sourcePrimaryKeyField] },
				} as Filter<R>);
			}

			const relatedEntityFilter = { _and } as Filter<R>;

			const params: ReadHookParams<R> = {
				args: { filter: relatedEntityFilter },
				context,
				fields,
				transactional: !!parentEntity.provider?.withTransaction,
			};
			const hookManager = hookManagerMap.get(gqlEntityType.name);
			const hookParams = hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			logger.trace('Aggregating with related field');

			const result = await relatedEntityMetadata.provider?.aggregate?.(
				relatedEntityFilter,
				requestedAggregations
			);

			if (!result) throw new Error('No result from aggregation.');

			logger.trace('Running after read hooks');
			if (hookManager) {
				await hookManager.runHooks(HookRegister.AFTER_READ, hookParams);
			}

			logger.trace('After read hooks ran');

			return result;
		}
	);

export const getOne = trace(_getOne);
export const list = trace(_list);
export const listRelationshipField = trace(_listRelationshipField);
export const createOrUpdate = trace(_createOrUpdate);
export const deleteOne = trace(_deleteOne);
export const deleteMany = trace(_deleteMany);
export const aggregate = trace(_aggregate);
