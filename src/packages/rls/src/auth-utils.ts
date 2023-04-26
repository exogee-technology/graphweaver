import { logger } from '@exogee/logger';
import { ForbiddenError } from 'apollo-server-errors';

import {
	AccessControlList,
	AccessType,
	AuthorizationContext,
	ConsolidatedAccessControlEntry,
	ConsolidatedAccessControlValue,
} from './types';
import {
	AclMap,
	buildAccessControlEntryForUser,
	evaluateConsolidatedAccessControlValue,
	getRolesFromAuthorizationContext,
} from './helper-functions';
import { BaseDataEntity, GraphQLEntity } from '@exogee/graphweaver';

export const GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';

export const getACL = (gqlEntityTypeName: string) => {
	const acl = AclMap.get(gqlEntityTypeName);
	if (!acl) {
		logger.trace(`An attempt to access entity '${gqlEntityTypeName}' was blocked. No ACL found.`);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
	return acl;
};

export const assertUserCanPerformRequestedAction = (
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

export const getAccessFilter = async (
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

export const requiredPermissionsForAction = (intent: any): AccessType => {
	const keys = Object.keys(intent);
	const length = keys.length;

	if (length === 1 && intent.id !== undefined) {
		return AccessType.Read;
	} else if (length > 1 && intent.id !== undefined) {
		return AccessType.Update;
	} else if (Object.keys(intent).length > 0 && intent.id === undefined) {
		return AccessType.Create;
	}

	logger.trace(
		'Raising ForbiddenError: User did not have sufficient privileges for the desired action'
	);
	throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
};

const permissionsErrorHandler = (error: any) => {
	if ((error as any).name === 'NotFoundError') {
		logger.trace(
			'Raising ForbiddenError: Could not find object in database (likely because a query did not pass a permission filter)'
		);
	}
	throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
};

const assertAccessControlValueNotEmpty = <G, TContext extends AuthorizationContext>(
	acv: ConsolidatedAccessControlValue<G, TContext> | undefined
) => {
	if (!(acv === true || acv !== undefined)) {
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
};

export const assertObjectLevelPermissions = <G, TContext extends AuthorizationContext>(
	userPermission: ConsolidatedAccessControlEntry<G, TContext>,
	requiredPermission: AccessType
) => {
	assertAccessControlValueNotEmpty(userPermission[requiredPermission]);
};

export async function checkFilterPermsForReference<G extends GraphQLEntity<BaseDataEntity>>(
	entity: G,
	accessType: AccessType
) {
	const {
		id,
		constructor: { name },
	} = entity as any;
	if (!name) {
		logger.error('Raising ForbiddenError: Could not determine entity name');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	const acl = getACL(name);
	const accessControlEntry = buildAccessControlEntryForUser(
		acl,
		getRolesFromAuthorizationContext()
	);

	const consolidatedAccessControlValue = accessControlEntry[accessType];
	if (consolidatedAccessControlValue === true) {
		// User has been explicitly granted full access for this entity and access type
		return;
	}
	if (consolidatedAccessControlValue === undefined) {
		// No access has been granted for this operation
		logger.trace(
			'Raising ForbiddenError: User does not have any permissions on this entity for this access type'
		);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	const accessFilter = await evaluateConsolidatedAccessControlValue(consolidatedAccessControlValue);

	// Some filters will work by filtering by ID so we need to check that they match
	if (Object(accessFilter).hasOwnProperty('id') && Object(accessFilter).id !== id) {
		logger.trace('Raising ForbiddenError: Request rejected because ID based filter did not match');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	// All the easy checks have been performed, go ahead and run the filter against the db
	const where = {
		_and: [{ id }, accessFilter],
	};

	try {
		const result = await entity.backendProvider?.findOne(where);
		console.log(result);
		// await provider.findOne(where);
		// await ConnectionManager.default.em.findOneOrFail(name, where);
	} catch (error) {
		if ((error as any).name === 'NotFoundError') {
			logger.trace('Raising ForbiddenError: User is not allowed to access this record');
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}
		throw new Error('An unexpected error has occurred');
	}
}

export async function checkAuthorization<G extends GraphQLEntity<D>, D extends BaseDataEntity>(
	entity: G,
	requestInput: Partial<G>,
	requiredPermission: AccessType
) {
	// Get ACL first
	const proto = Object.getPrototypeOf(entity);
	const acl = getACL(proto.constructor.name);

	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	assertUserCanPerformRequestedAction(acl, requiredPermission);

	// Now check whether the root entity passes permissions filters (if set)
	await checkFilterPermsForReference(entity, requiredPermission);

	// Recurse through the list
	const relatedEntityAuthChecks: Promise<any>[] = [];
	for (const [key, value] of Object.entries(entity)) {
		// Check whether this property was in the request payload.
		// Also filter out Scalar values as these have already been
		// checked above in the call to checkFilterPermsForReference
		if (checkPayloadAndFilterScalarsAndDates(requestInput, key, value)) {
			continue;
		}

		// const accessType = requiredPermissionsForAction(value);
		// if (entity.isReference?.(key, value)) {
		// 	// This property is a related entity
		// 	relatedEntityAuthChecks.push(
		// 		(async () => {
		// 			const entity = await value.load();
		// 			const input = requestInput[key as keyof D];
		// 			await Promise.all([
		// 				...(input ? [checkAuthorization(entity, input, accessType)] : []),
		// 				// checkFilterPermsForReference(value, accessType),
		// 			]);
		// 		})()
		// 	);
		// } else if (typeof (value as any)?.getItems === 'function') {
		// 	// This is a Collection (one to many or many to many related entity), iterate through each item in the collection
		// 	for (const item of (value as any).getItems()) {
		// 		const input = requestInput[key as keyof D];
		// 		relatedEntityAuthChecks.push(
		// 			Promise.all([
		// 				...(input
		// 					? [checkAuthorization(item, input, requiredPermissionsForAction(input))]
		// 					: []),
		// 				// checkFilterPermsForReference(wrap(item).toReference(), accessType),
		// 			])
		// 		);
		// 	}
		// } else if (
		// 	value &&
		// 	typeof value === 'object' &&
		// 	Object.keys(value as any)?.includes('__meta')
		// ) {
		// 	const input = requestInput[key as keyof D];
		// 	// Items within a Collection are not wrapped in a Reference
		// 	relatedEntityAuthChecks.push(
		// 		Promise.all([
		// 			...(input
		// 				? [checkAuthorization(value as any, input, requiredPermissionsForAction(input))]
		// 				: []),
		// 			// checkFilterPermsForReference(wrap(value).toReference(), accessType),
		// 		])
		// 	);
		// }
	}

	try {
		await Promise.all(relatedEntityAuthChecks);
	} catch (e) {
		logger.info(`Permission check failed:`, e);
		permissionsErrorHandler(e);
	}
}

const checkPayloadAndFilterScalarsAndDates = (requestInput: any, key: string, value: any) => {
	return (
		// If the request input is null then we don't need to check for related references and collections
		requestInput === null ||
		// Check whether this property was not in the request payload
		!Object.keys(requestInput).includes(key) ||
		// Check scalar values as these have already been
		// checked above in the call to checkFilterPermsForReference
		['string', 'number', 'boolean'].includes(typeof value) ||
		value === null ||
		value === undefined ||
		value instanceof Date
	);
};
