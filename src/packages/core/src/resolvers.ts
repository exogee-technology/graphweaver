import { GraphQLObjectType, GraphQLResolveInfo, isListType, isObjectType } from 'graphql';
import { logger } from '@exogee/logger';
import { BaseContext, GraphQLArgs } from './types';
import {
	BaseDataEntity,
	HookRegister,
	ReadHookParams,
	graphweaverMetadata,
	hookManagerMap,
} from '.';
import { QueryManager } from './query-manager';

export const getOne = async <C extends BaseContext>(source: unknown, args: unknown, context: C) => {
	console.log('getOne', source, args, context);
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
		throw new Error(`Entity ${name} does not have a provider, cannot resolve.`);
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

	const result = await QueryManager.find<D, G>({
		entityName: entity.name,
		filter: hookParams.args?.filter,
		pagination: hookParams.args?.pagination,
	});
	logger.trace({ result }, 'Got result');

	const gqlEntityType = entity.target as any;

	if (gqlEntityType.fromBackendEntity) {
		logger.trace(
			{ entityName: gqlEntityType.name },
			'Entity implements fromBackendEntity, converting'
		);

		const entities = result.map((entity) =>
			gqlEntityType.fromBackendEntity.call(gqlEntityType, entity)
		);

		logger.trace({ entities }, 'Converted entities');

		// return hookManager?.runHooks(HookRegister.AFTER_READ, entities);

		return entities;
	}

	// TODO: We should run the hooks here too, no?

	return result as any; // if there's no conversion function, we assume the gql and backend types match
};
