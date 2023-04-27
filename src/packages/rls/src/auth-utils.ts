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
	evaluateAccessControlValue,
	getRolesFromAuthorizationContext,
} from './helper-functions';
import {
	BaseDataEntity,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
} from '@exogee/graphweaver';

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
	return evaluateAccessControlValue(readEntry);
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

export async function checkEntityPermission<
	G extends GraphQLEntityConstructor<D>,
	D extends BaseDataEntity
>(entity: G, id: string, accessType: AccessType) {
	const { name } = entity;
	if (!name) {
		logger.error('Raising ForbiddenError: Could not determine entity name');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	const acl = getACL(name);
	const accessControlEntry = buildAccessControlEntryForUser(
		acl,
		getRolesFromAuthorizationContext()
	);

	const accessControlValue = accessControlEntry[accessType];
	if (accessControlValue === true) {
		// User has been explicitly granted full access for this entity and access type
		return;
	}
	if (accessControlValue === undefined) {
		// No access has been granted for this operation
		logger.trace(
			'Raising ForbiddenError: User does not have any permissions on this entity for this access type'
		);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	const accessFilter = await evaluateAccessControlValue(accessControlValue);

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
		const { provider } = EntityMetadataMap.get(name) ?? {};
		const result = await provider?.findOne(where);
		if (!result) {
			logger.trace('Raising ForbiddenError: User is not allowed to access this record');
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}
	} catch (error) {
		if ((error as any).message === GENERIC_AUTH_ERROR_MESSAGE) {
			throw error;
		}
		throw new Error('An unexpected error has occurred');
	}
}

export async function checkAuthorization<
	G extends GraphQLEntityConstructor<D>,
	D extends BaseDataEntity
>(entity: G, id: string, requestInput: Partial<G>, requiredPermission: AccessType) {
	// Get ACL first
	const acl = getACL(entity.name);
	const meta = EntityMetadataMap.get(entity.name);

	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	assertUserCanPerformRequestedAction(acl, requiredPermission);

	// Now check whether the root entity passes permissions filters (if set)
	await checkEntityPermission(entity as any, id, requiredPermission);

	// Recurse through the list
	const relatedEntityAuthChecks: Promise<any>[] = [];
	const entries = Object.entries(requestInput);

	for (const [key, value] of entries) {
		// Check whether this property was in the request payload.
		// Also filter out Scalar values as these have already been
		// checked above in the call to checkFilterPerms
		if (checkPayloadAndFilterScalarsAndDates(requestInput, key, value)) {
			continue;
		}

		// If we are here then we have an array or an object lets see if its a related entity
		const relationship = meta?.fields.find((field) => field.name === key);
		const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<BaseDataEntity>;
		const isRelatedEntity = relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;
		if (isRelatedEntity) {
			// Now we have a related entity lets check we have permission
			const accessType = requiredPermissionsForAction(value);
			const values = Array.isArray(value) ? value : [value];
			for (const item of values) {
				const relatedId = item?.id;

				// We only check the nested inputs with ID's, this is because if there was no ID
				// supplied in the input args then the entity has been created in the data source.
				// The creation hook will triggered for that entity and the permissions checked
				if (relatedId) {
					relatedEntityAuthChecks.push(
						checkAuthorization(relatedEntity, relatedId, item, accessType)
					);
				}
			}
		}
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
