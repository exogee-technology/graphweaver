import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
	ReadHookParams,
	hasId,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

import { AccessType, AuthorizationContext } from '../../types';
import { andFilters } from '../../helper-functions';
import {
	GENERIC_AUTH_ERROR_MESSAGE,
	assertUserCanPerformRequestedAction,
	checkAuthorization,
	getACL,
	getAccessFilter,
} from '../../auth-utils';

const isPopulatedFilter = (filter: any): boolean => Object.keys(filter).length > 0;
const assertTransactional = (transactional: boolean) => {
	if (!transactional) {
		logger.error(
			'Row Level Security can only be applied within a transaction and this hook is not transactional.'
		);
		throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
	}
};

export const afterCreateOrUpdate = async <G>(
	params: CreateOrUpdateHookParams<G, AuthorizationContext>
) => {
	const items = params.args.items;
	const entities = (params.entities ?? []) as GraphQLEntity<BaseDataEntity>[];

	// 1. Check to ensure we are within a transaction
	assertTransactional(params.transactional);
	// 2. Check user has permission for each
	// @todo what if the order returned is not the same as the input?
	const authChecks = entities.map((entity, index) =>
		entity?.id
			? checkAuthorization(
					Object.getPrototypeOf(entity).constructor,
					entity.id,
					items[index],
					AccessType.Create
			  )
			: undefined
	);
	await Promise.all(authChecks);
	return params;
};

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		// 1. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 2. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequestedAction(acl, AccessType.Read);
		// 3. Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Read);
		const consolidatedFilter = andFilters(params.args.filter, accessFilter);

		return {
			...params,
			args: {
				...params.args,
				filter: consolidatedFilter,
			},
		};
	};
};

export const beforeCreate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		// 1. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 2. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequestedAction(acl, AccessType.Create);
		// 3. Fetch the filter for the currently logged in user
		const accessFilter = await getAccessFilter(acl, AccessType.Create);
		// 4. Check if the filter has values and then assert we are in a transaction
		// You can only use a filter in this way when you are in a transaction
		if (isPopulatedFilter(accessFilter)) assertTransactional(params.transactional);

		return params;
	};
};

export const beforeUpdate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		// 1. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 2. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequestedAction(acl, AccessType.Update);

		const items = params.args.items.filter(hasId);
		const { entity } = EntityMetadataMap.get(gqlEntityTypeName) ?? {};

		if (!entity) {
			throw new Error(
				'Raising ForbiddenError: Request rejected as no entity constructor was found'
			);
		}

		const target = entity.target as GraphQLEntityConstructor<
			GraphQLEntity<BaseDataEntity>,
			BaseDataEntity
		>;

		// 3. Check to ensure we are within a transaction
		assertTransactional(params.transactional);
		// 4. Check user has permission for each item
		const authChecks = items.map((item) =>
			checkAuthorization(target, item.id, item, AccessType.Update)
		);
		await Promise.all(authChecks);
		return params;
	};
};

export const beforeDelete = (gqlEntityTypeName: string) => {
	return async <G>(params: DeleteHookParams<G, AuthorizationContext>) => {
		// 1. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 2. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequestedAction(acl, AccessType.Delete);
		// 3. Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Delete);
		const consolidatedFilter = andFilters(params.args.filter, accessFilter);

		return {
			...params,
			args: {
				...params.args,
				filter: consolidatedFilter,
			},
		};
	};
};
