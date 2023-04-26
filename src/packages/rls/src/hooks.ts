import { DeleteHookParams, ReadHookParams } from '@exogee/graphweaver';

import { AccessType, AuthorizationContext } from './types';
import { andFilters } from './helper-functions';
import { assertUserCanPerformRequestedAction, getACL, getAccessFilter } from './auth-utils';

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
