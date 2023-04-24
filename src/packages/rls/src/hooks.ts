import { logger } from '@exogee/logger';
import { ReadHookParams } from '@exogee/graphweaver';
import { ForbiddenError } from 'apollo-server-errors';

import { AccessType, AuthorizationContext } from './types';
import {
	AclMap,
	andFilters,
	buildAccessControlEntryForUser,
	evaluateConsolidatedAccessControlValue,
	getRolesFromAuthorizationContext,
} from './helper-functions';
import { GENERIC_AUTH_ERROR_MESSAGE } from './auth-utils';

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		const acl = AclMap.get(gqlEntityTypeName);
		if (!acl) throw new Error(`Could not get ACL for ${gqlEntityTypeName}`);
		// Check permissions for this (root level) entity for the currently logged in user
		const consolidatedAclEntry = buildAccessControlEntryForUser(
			acl,
			getRolesFromAuthorizationContext()
		);

		const readEntry = consolidatedAclEntry[AccessType.Read];
		if (!readEntry) {
			logger.trace(`Raising ForbiddenError: User does not have read access on this entity`);
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}

		// If there are conditional permission filters, augment the supplied filter with them
		const accessFilter = await evaluateConsolidatedAccessControlValue<G, AuthorizationContext>(
			readEntry
		);
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
