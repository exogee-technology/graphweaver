import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLEntity,
	ReadHookParams,
} from '@exogee/graphweaver';

import { AccessType, AuthorizationContext } from './types';
import { andFilters } from './helper-functions';
import {
	assertUserCanPerformRequestedAction,
	checkAuthorization,
	getACL,
	getAccessFilter,
} from './auth-utils';

const assertTransactional = (transactional: boolean) => {
	if (!transactional)
		throw new Error(
			'Row Level Security can only be applied within a transaction and this hook is not transactional.'
		);
};

export const afterCreate = async <G extends GraphQLEntity<D>, D extends BaseDataEntity>(
	params: CreateOrUpdateHookParams<G, AuthorizationContext>
) => {
	const items = params.args.items;
	const entities = params.entities ?? [];

	// 1. Check to ensure we are within a transaction
	assertTransactional(params.transactional);
	// 2. Check user has permission for each
	// @todo what if the order returned is not the same as the input?
	const authChecks = entities.map((entity, index) =>
		entity?.dataEntity ? checkAuthorization(entity, items[index], AccessType.Create) : undefined
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

export const beforeUpdate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		// 1. Check to ensure we are within a transaction
		assertTransactional(params.transactional);
		return params;
	};
};

export const afterUpdate = async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
	// 1. Check to ensure we are within a transaction
	assertTransactional(params.transactional);
	return params;
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
