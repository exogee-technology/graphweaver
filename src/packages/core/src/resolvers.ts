import { GraphQLObjectType, GraphQLResolveInfo, isListType, isObjectType } from 'graphql';
import { logger } from '@exogee/logger';
import { BaseContext, GraphQLArgs } from './types';
import {
	BaseDataEntity,
	Filter,
	HookRegister,
	ReadHookParams,
	graphweaverMetadata,
	hookManagerMap,
} from '.';
import { QueryManager } from './query-manager';

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
		throw new Error(`Entity ${name} does not have a provider, cannot resolve[].`);
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
