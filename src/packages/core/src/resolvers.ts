import { GraphQLObjectType, GraphQLResolveInfo, isListType, isObjectType } from 'graphql';
import { logger } from '@exogee/logger';
import { BaseContext, GraphQLArgs } from './types';
import {
	BaseDataEntity,
	BaseLoaders,
	Filter,
	GraphQLEntityConstructor,
	HookRegister,
	ReadHookParams,
	WithId,
	createOrUpdateEntities,
	graphweaverMetadata,
	hookManagerMap,
	isEntityMetadata,
	runWritableBeforeHooks,
} from '.';
import { QueryManager } from './query-manager';
import { withTransaction } from './utils/with-transaction';

export const getOne = async <G, C extends BaseContext>(
	source: unknown,
	{ id }: { id: string },
	context: C,
	info: GraphQLResolveInfo
) => {
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

	const hookManager = hookManagerMap.get(entity.name);

	const params: ReadHookParams<G> = {
		// TODO: Can we fix the as any here?
		args: { filter: { id } as any },
		info,
		context,
		transactional: false,
	};

	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	if (!hookParams.args?.filter) throw new Error('No find filter specified cannot continue.');

	let result = await entity.provider.findOne(hookParams.args.filter);
	const gqlEntityType = entity.target as any;

	// If there's a fromBackendEntity function on the entity, go ahead and run it.
	if (result && gqlEntityType.fromBackendEntity) {
		result = gqlEntityType.fromBackendEntity.call(gqlEntityType, result);
	}

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

export const list = async <G, D extends BaseDataEntity, C extends BaseContext>(
	source: unknown,
	{ filter, pagination }: Omit<GraphQLArgs<G>, 'items'>,
	context: C,
	info: GraphQLResolveInfo
) => {
	logger.trace({ filter, pagination, context, info }, 'List resolver called.');

	if (!isListType(info.returnType)) {
		throw new Error('Graphweaver list resolver can only be used to return list types.');
	}

	if (!isObjectType(info.returnType.ofType)) {
		throw new Error('Graphweaver list resolver can only be used to return lists of objects.');
	}

	const { name } = info.returnType.ofType;
	const entity = graphweaverMetadata.getEntityByName(name);

	if (!entity) {
		throw new Error(`Entity ${name} not found in metadata.`);
	}

	if (!entity.provider) {
		throw new Error(`Entity ${name} does not have a provider, cannot resolve list operation.`);
	}

	const hookManager = hookManagerMap.get(entity.name);
	const params: ReadHookParams<G> = {
		args: { filter, pagination },
		info,
		context,
		transactional: false,
	};
	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	let result = await QueryManager.find<D, G>({
		entityName: entity.name,
		filter: hookParams.args?.filter,
		pagination: hookParams.args?.pagination,
	});
	logger.trace({ result }, 'Got result');

	// If there's a fromBackendEntity function on the entity, go ahead and run it.
	const gqlEntityType = entity.target as any;
	if (gqlEntityType.fromBackendEntity) {
		logger.trace(
			{ entityName: gqlEntityType.name },
			'Entity implements fromBackendEntity, converting'
		);

		result = result.map((entity) => gqlEntityType.fromBackendEntity.call(gqlEntityType, entity));

		logger.trace({ result }, 'Converted entities');
	}

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

export const create = async <G extends WithId & { name: string }, C extends BaseContext>(
	source: unknown,
	input: Partial<G> | Partial<G>[],
	context: C,
	info: GraphQLResolveInfo
) => {
	logger.trace({ input, context, info }, 'Create resolver called.');

	if (!isObjectType(info.returnType)) {
		throw new Error('Graphweaver getOne resolver can only be used to return single objects.');
	}

	const { name } = info.returnType;
	const entity = graphweaverMetadata.getEntityByName<G, BaseDataEntity>(name);

	if (!entity) {
		throw new Error(`Entity ${name} not found in metadata.`);
	}

	if (!entity.provider) {
		throw new Error(`Entity ${name} does not have a provider, cannot resolve create operation.`);
	}

	const transactional = !!entity.provider.withTransaction;

	return withTransaction<G | null>(entity.provider, async () => {
		const params = await runWritableBeforeHooks(
			HookRegister.BEFORE_CREATE,
			{
				args: { items: Array.isArray(input) ? input : [input] },
				info,
				context,
				transactional,
			},
			entity.name
		);
		const [item] = params.args.items;

		let result = (await createOrUpdateEntities(item, entity, info, context)) as G;

		// Run any after hooks if we have them.
		const hookManager = hookManagerMap.get(entity.name);
		if (hookManager) {
			const { entities } = await hookManager.runHooks(HookRegister.AFTER_CREATE, {
				...params,
				entities: [result],
			});
			result = entities[0];
		}

		return result;
	});
};

export const listRelationshipField = async <
	G extends WithId & { name: string } & { dataEntity: D },
	D extends BaseDataEntity,
	C extends BaseContext,
>(
	source: G,
	input: { filter: Filter<G> },
	context: C,
	info: GraphQLResolveInfo
) => {
	logger.trace(`Resolving ${info.parentType.name}.${info.fieldName}`);

	if (!info.path.typename)
		throw new Error(`No typename found in path for ${info.path}, this should not happen.`);

	const entity = graphweaverMetadata.getEntityByName(info.path.typename);
	if (!entity) {
		throw new Error(`Entity ${source.name} not found in metadata. This should not happen.`);
	}

	// If we've already resolved the data, we may want to return it, but we want the hooks to run first.
	const existingData = source[info.fieldName as keyof typeof source];

	const field = entity.fields[info.fieldName];
	const { id, relatedField } = field.relationshipInfo ?? {};
	const idValue = !id
		? undefined
		: typeof id === 'function'
			? id(source.dataEntity)
			: (source.dataEntity as any)[id];

	if (typeof existingData === 'undefined' && !idValue && !field.relationshipInfo?.relatedField) {
		// id is null and we are loading a single instance so let's return null
		return null;
	}

	let gqlEntityType = field.getType() as
		| GraphQLEntityConstructor<G, D>
		| GraphQLEntityConstructor<G, D>[];
	let isList = false;

	if (Array.isArray(gqlEntityType)) {
		isList = true;
		gqlEntityType = gqlEntityType[0];
	}

	// @todo: Should the user specifie dfilter be and-ed here?
	//        My worry is if we just pass the filter through, it could be used to circumvent the relationship join.
	const relatedEntityFilter =
		input.filter ?? idValue ? { id: idValue } : { [relatedField as string]: { id: source.id } };

	const params: ReadHookParams<G> = {
		args: { filter: input.filter },
		info,
		context,
		transactional: false,
	};
	const hookManager = hookManagerMap.get(gqlEntityType.name);
	const hookParams = hookManager
		? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		: params;

	// Ok, now we've run our hooks and validated permissions, let's first check if we already have the data.
	logger.trace('Checking for existing data.');

	if (typeof existingData !== 'undefined') {
		logger.trace({ existingData }, 'Existing data found, returning.');
		return existingData;
	}

	logger.trace('Existing data not found. Loading from BaseLoaders');

	let dataEntities: D[] | undefined = undefined;
	if (field.relationshipInfo?.relatedField) {
		logger.trace('Loading with loadByRelatedId');

		dataEntities = await BaseLoaders.loadByRelatedId({
			gqlEntityType,
			relatedField: field.relationshipInfo.relatedField,
			id: String(source.id),
			filter: relatedEntityFilter as Filter<G>,
		});
	} else if (idValue) {
		logger.trace('Loading with loadOne');

		const dataEntity = await BaseLoaders.loadOne({
			gqlEntityType,
			id: idValue,
		});
		dataEntities = [dataEntity];
	}

	let entities = dataEntities;
	if ('fromBackendEntity' in gqlEntityType) {
		logger.trace('Running fromBackendEntity on result');

		entities = dataEntities?.map((dataEntity) =>
			(gqlEntityType as any).fromBackendEntity(dataEntity)
		);
	}

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
