import { logger } from '@exogee/logger';
import { DeleteHookParams, ReadHookParams } from '@exogee/graphweaver';
import { ForbiddenError } from 'apollo-server-errors';

import { AccessControlList, AccessType, AuthorizationContext } from './types';
import {
	AclMap,
	andFilters,
	buildAccessControlEntryForUser,
	evaluateConsolidatedAccessControlValue,
	getRolesFromAuthorizationContext,
} from './helper-functions';
import { GENERIC_AUTH_ERROR_MESSAGE, assertObjectLevelPermissions } from './auth-utils';

const getACL = (gqlEntityTypeName: string) => {
	const acl = AclMap.get(gqlEntityTypeName);
	if (!acl) {
		logger.trace(`An attempt to access entity '${gqlEntityTypeName}' was blocked. No ACL found.`);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
	return acl;
};

const assertUserCanPerformRequestedAction = (
	acl: Partial<AccessControlList<any, any>>,
	requiredPermission: AccessType
) => {
	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	assertObjectLevelPermissions(
		buildAccessControlEntryForUser(acl, getRolesFromAuthorizationContext()),
		requiredPermission
	);
};

const getAccessFilter = async (
	acl: Partial<AccessControlList<any, any>>,
	requiredPermission: AccessType
) => {
	const consolidatedAclEntry = buildAccessControlEntryForUser(
		acl,
		getRolesFromAuthorizationContext()
	);

	const readEntry = consolidatedAclEntry[requiredPermission];
	if (!readEntry) {
		logger.trace(
			`Raising ForbiddenError: User does not have ${requiredPermission} access on this entity`
		);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	// If there are conditional permission filters, augment the supplied filter with them
	return evaluateConsolidatedAccessControlValue(readEntry);
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
