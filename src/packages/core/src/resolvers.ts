import {
	GraphQLFieldResolver,
	GraphQLResolveInfo,
	Source,
	isListType,
	isObjectType,
} from 'graphql';
import { logger } from '@exogee/logger';
import { BaseContext, GraphQLArgs } from './types';
import {
	BaseLoaders,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	DeleteManyHookParams,
	EntityMetadata,
	Filter,
	HookRegister,
	ReadHookParams,
	Resolver,
	ResolverOptions,
	createOrUpdateEntities,
	getFieldTypeFromFieldMetadata,
	graphweaverMetadata,
	hookManagerMap,
	isEntityMetadata,
	isTransformableGraphQLEntityClass,
} from '.';
import { QueryManager } from './query-manager';
import { applyDefaultValues, hasId, withTransaction } from './utils';
import { ResolveTree, parseResolveInfo } from 'graphql-parse-resolve-info';
import { fromBackendEntity } from './default-from-backend-entity';

export const baseResolver = (resolver: Resolver) => {
	return (source: Source, args: any, context: BaseContext, info: GraphQLResolveInfo) => {
		return resolver({
			args,
			context,
			fields: (parseResolveInfo(info) ?? {}) as ResolveTree,
			info,
			source,
		});
	};
};

export const getOne = async <G>({ args: { id }, context, fields, info }: ResolverOptions) => {
	logger.trace({ id, context, info }, 'Get One resolver called.');

	if (!isObjectType(info.returnType)) {
		throw new Error('Graphweaver getOne resolver can only be used to return single objects.');
	}

	const { name } = info.returnType;
	const entity = graphweaverMetadata.getEntityByName(name);

	if (!entity) {
		throw new Error(`Entity ${name} not found in metadata.`);
	}

	if (!entity.provider) {
		throw new Error(`Entity ${name} does not have a provider, cannot resolve.`);
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

export const list = async <G, D>({
	args: { filter, pagination },
	context,
	info,
	fields,
}: ResolverOptions) => {
	logger.trace({ filter, pagination, context, info }, 'List resolver called.');

	if (!isListType(info.returnType)) {
		throw new Error('Graphweaver list resolver can only be used to return list types.');
	}

	if (!isObjectType(info.returnType.ofType)) {
		throw new Error('Graphweaver list resolver can only be used to return lists of objects.');
	}

	const { name } = info.returnType.ofType;
	const entity = graphweaverMetadata.getEntityByName<any, any>(name);

	if (!entity) {
		throw new Error(`Entity ${name} not found in metadata.`);
	}

	if (!entity.provider) {
		throw new Error(`Entity ${name} does not have a provider, cannot resolve list operation.`);
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

	result = result.map((resultRow) => fromBackendEntity(entity, resultRow));

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

export const createOrUpdate = async <G, D>({
	args: { input },
	context,
	info,
	fields,
}: ResolverOptions<{ input: Partial<G> | Partial<G>[] }>) => {
	logger.trace({ input, context, info }, 'Create or Update resolver called.');

	let name;

	if (isObjectType(info.returnType)) {
		name = info.returnType.name;
	} else if (isListType(info.returnType) && isObjectType(info.returnType.ofType)) {
		name = info.returnType.ofType.name;
	} else {
		throw new Error('Could not determine entity name from return type.');
	}

	const entity = graphweaverMetadata.getEntityByName<G, D>(name);

	if (!entity) {
		throw new Error(`Entity ${name} not found in metadata.`);
	}

	if (!entity.provider) {
		throw new Error(
			`Entity ${name} does not have a provider, cannot resolve create or update operation.`
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

// This is a function generator where you can bind it to the correct entity when creating it, as we cannot look up the entity name / type from the info object.
export const deleteOne =
	(entity: EntityMetadata<any, any>) =>
	async <G extends { name: string }>({
		args: { filter },
		context,
		fields,
	}: ResolverOptions<{ filter: Filter<G> }>) => {
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

export const deleteMany =
	(entity: EntityMetadata<any, any>) =>
	async <G>({ args: { filter }, context, fields }: ResolverOptions<{ filter: Filter<G> }>) => {
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

export const listRelationshipField = async <G, D, R, C extends BaseContext>({
	source,
	args: { filter },
	context,
	fields,
	info,
}: ResolverOptions<{ filter: Filter<R> }, C, G>) => {
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
	const idValue = !id ? undefined : typeof id === 'function' ? id(source) : (source as any)[id];

	if (typeof existingData === 'undefined' && !idValue && !field.relationshipInfo?.relatedField) {
		// id is null and we are loading a single instance so let's return null
		return null;
	}

	const { fieldType, isList } = getFieldTypeFromFieldMetadata(field);
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
			id: idValue,
		});
		dataEntities = [dataEntity];
	}

	const entities = dataEntities?.map((dataEntity) =>
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
