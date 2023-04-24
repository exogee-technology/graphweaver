import { EntityMetadataMap } from '@exogee/graphweaver';
import {
	ConnectionManager,
	DatabaseObjectNotFoundException,
	Reference,
	wrap,
} from '@exogee/graphweaver-mikroorm';
import { logger } from '@exogee/logger';
import { ForbiddenError } from 'apollo-server-errors';

import {
	AccessType,
	ConsolidatedAccessControlEntry,
	ConsolidatedAccessControlValue,
} from './types';
import {
	buildAccessControlEntryForUser,
	evaluateConsolidatedAccessControlValue,
	getRolesFromAuthorizationContext,
} from './helper-functions';

export const GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';

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
	if (error instanceof DatabaseObjectNotFoundException || (error as any).name === 'NotFoundError') {
		logger.trace(
			'Raising ForbiddenError: Could not find object in database (likely because a query did not pass a permission filter)'
		);
	}
	throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
};

const assertAccessControlValueNotEmpty = (acv: ConsolidatedAccessControlValue<any> | undefined) => {
	if (!(acv === true || acv !== undefined)) {
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
};

export const assertObjectLevelPermissions = (
	userPermission: ConsolidatedAccessControlEntry<any>,
	requiredPermission: AccessType
) => {
	assertAccessControlValueNotEmpty(userPermission[requiredPermission]);
};

export async function checkFilterPermsForReference(value: Reference<any>, accessType: AccessType) {
	// Initialise entity first
	const entity = await value.load();
	const entityName: string = entity.__meta?.name;
	if (!entityName) {
		logger.error('Raising ForbiddenError: Could not determine entity name');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	const acl = EntityMetadataMap.get(entityName)?.accessControlList;
	if (!acl) {
		logger.error(`Could not get entity ACL for nested entity ${entityName}`);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

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

	const {
		id,
		constructor: { name },
	}: any = value.unwrap();

	const accessFilter = await evaluateConsolidatedAccessControlValue(consolidatedAccessControlValue);

	// Some filters will work by filtering by ID so we need to check that they match
	if (Object(accessFilter).hasOwnProperty('id') && Object(accessFilter).id !== id) {
		logger.trace('Raising ForbiddenError: Request rejected because ID based filter did not match');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	// All the easy checks have been performed, go ahead and run the filter against the db
	const where = {
		$and: [{ id }, accessFilter],
	};

	try {
		await ConnectionManager.default.em.findOneOrFail(name, where);
	} catch (error) {
		if (
			error instanceof DatabaseObjectNotFoundException ||
			(error as any).name === 'NotFoundError'
		) {
			logger.trace('Raising ForbiddenError: User is not allowed to access this record');
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}
		throw new Error('An unexpected error has occurred');
	}
}

export async function checkAuthorization(
	entity: any,
	requestInput: any,
	requiredPermission: AccessType
) {
	// Get ACL first
	const proto = Object.getPrototypeOf(entity);
	const access = EntityMetadataMap.get(proto.constructor.name)?.accessControlList;
	if (!access) {
		logger.trace(
			`An attempt to access entity '${
				Object.getPrototypeOf(entity).constructor.name
			}' was blocked. No ACL found.`
		);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	assertObjectLevelPermissions(
		buildAccessControlEntryForUser(access, getRolesFromAuthorizationContext()),
		requiredPermission
	);
	// Now check whether the root entity passes permissions filters (if set)
	await checkFilterPermsForReference(wrap(entity).toReference(), requiredPermission);

	// Recurse through the list
	const relatedEntityAuthChecks: Promise<any>[] = [];
	for (const [key, value] of Object.entries(entity)) {
		// Check whether this property was in the request payload.
		// Also filter out Scalar values as these have already been
		// checked above in the call to checkFilterPermsForReference
		if (checkPayloadAndFilterScalarsAndDates(requestInput, key, value)) {
			continue;
		}

		const accessType = requiredPermissionsForAction(value);
		if (Reference.isReference(value)) {
			// This property is a related entity
			relatedEntityAuthChecks.push(
				(async () => {
					const entity = await value.load();
					await Promise.all([
						checkAuthorization(entity, requestInput[key], accessType),
						checkFilterPermsForReference(value, accessType),
					]);
				})()
			);
		} else if (typeof (value as any)?.getItems === 'function') {
			// This is a Collection (one to many or many to many related entity), iterate through each item in the collection
			for (const item of (value as any).getItems()) {
				relatedEntityAuthChecks.push(
					Promise.all([
						checkAuthorization(
							item,
							requestInput[key],
							requiredPermissionsForAction(requestInput[key])
						),
						checkFilterPermsForReference(wrap(item).toReference(), accessType),
					])
				);
			}
		} else if (
			value &&
			typeof value === 'object' &&
			Object.keys(value as any)?.includes('__meta')
		) {
			// Items within a Collection are not wrapped in a Reference
			relatedEntityAuthChecks.push(
				Promise.all([
					checkAuthorization(
						value as any,
						requestInput[key],
						requiredPermissionsForAction(requestInput[key])
					),
					checkFilterPermsForReference(wrap(value).toReference(), accessType),
				])
			);
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
