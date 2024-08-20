import { logger } from '@exogee/logger';
import { ForbiddenError } from 'apollo-server-errors';
import { Filter, graphweaverMetadata, isEntityMetadata } from '@exogee/graphweaver';

import {
	AccessControlList,
	AccessType,
	AuthorizationContext,
	BASE_ROLE_EVERYONE,
	ConsolidatedAccessControlEntry,
	ConsolidatedAccessControlValue,
} from './types';
import {
	AclMap,
	buildAccessControlEntryForUser,
	buildFieldAccessControlEntryForUser,
	evaluateAccessControlValue,
} from './helper-functions';
import { getAuthorizationContext, getRolesFromAuthorizationContext } from './authorization-context';
import { RestrictedFieldError, FieldLocation } from './errors';

export const GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';

export const isPopulatedFilter = <G>(filter: boolean | Filter<G>): filter is Filter<G> =>
	filter && Object.keys(filter).length > 0;

export const getACL = (gqlEntityTypeName: string) => {
	const acl = AclMap.get(gqlEntityTypeName);
	if (!acl) {
		logger.trace(`An attempt to access entity '${gqlEntityTypeName}' was blocked. No ACL found.`);
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
	return acl;
};

export const assertUserCanPerformRequestedAction = async (
	acl: Partial<AccessControlList<any, any>>,
	requiredPermission: AccessType
) => {
	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	await assertObjectLevelPermissions(
		buildAccessControlEntryForUser(acl, getRolesFromAuthorizationContext()),
		requiredPermission
	);
};

export type FieldDetails = {
	name: string;
	location: FieldLocation;
};

export const assertUserHasAccessToField = <TContext extends AuthorizationContext>({
	field,
	entityName,
	context,
	accessType,
}: {
	field: FieldDetails;
	entityName: string;
	context: TContext;
	accessType: AccessType;
}) => {
	const roles = [...getRolesFromAuthorizationContext(), BASE_ROLE_EVERYONE];
	const acl = getACL(entityName);
	const result = buildFieldAccessControlEntryForUser(acl, roles, context);

	const restrictedFields = result[accessType];
	if (!restrictedFields) return;

	if (restrictedFields.has(field.name)) {
		logger.error(
			restrictedFields,
			`User does not have access to field: '${field.name}' on ${entityName} entity`
		);

		throw new RestrictedFieldError(entityName, field);
	}
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

const assertAccessControlValueNotEmpty = async <G, TContext extends AuthorizationContext>(
	acv: ConsolidatedAccessControlValue<G, TContext> | undefined
) => {
	if (!(acv === true || acv !== undefined)) {
		logger.trace('Raising ForbiddenError: Access control value is either false or not defined.');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
	if (Array.isArray(acv) && acv.length === 0) {
		logger.trace('Raising ForbiddenError: Access control value is an empty array.');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}
	if (Array.isArray(acv)) {
		const authContext = getAuthorizationContext();

		if (!authContext) {
			throw new Error('Authorisation context provider not initialised');
		}

		// Let's resolve the filter functions and check if any of them return false or undefined
		const filterFunctions = acv.map(async (value) => value(authContext as TContext));
		const resolvedFilterFunctions =
			await Promise.allSettled<Promise<boolean | Filter<G>>>(filterFunctions);

		// Filter rejections and log them
		resolvedFilterFunctions
			.filter(
				(filter): filter is { status: 'rejected'; reason: string } => filter.status === 'rejected'
			)
			.forEach((filter) =>
				logger.error('Error while evaluating permissions filter: ', filter.reason)
			);

		// If any of the filters returned false or undefined, we should reject the request
		const hasAccess = resolvedFilterFunctions.every(
			(filter) =>
				filter.status === 'fulfilled' && (filter.value === true || isPopulatedFilter(filter.value))
		);

		if (!hasAccess) {
			logger.trace(
				'Raising ForbiddenError: A filter function returned false or undefined, so the request is rejected.'
			);
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}
	}
};

export const assertObjectLevelPermissions = async <G, TContext extends AuthorizationContext>(
	userPermission: ConsolidatedAccessControlEntry<G, TContext>,
	requiredPermission: AccessType
) => assertAccessControlValueNotEmpty(userPermission[requiredPermission]);

export async function checkEntityPermission<G = unknown, D = unknown>(
	entityName: string,
	id: string | number,
	accessType: AccessType
) {
	const acl = getACL(entityName);
	const accessControlEntry = buildAccessControlEntryForUser(
		acl,
		getRolesFromAuthorizationContext() as string[]
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

	const entityMetadata = graphweaverMetadata.getEntityByName<G, D>(entityName);
	if (!entityMetadata) throw new Error(`Could not locate metadata for '${entityName}' entity.`);
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetadata);

	// Some filters will work by filtering by ID so we need to check that they match
	if (
		Object(accessFilter).hasOwnProperty(primaryKeyField) &&
		Object(accessFilter)[primaryKeyField] !== id
	) {
		logger.trace('Raising ForbiddenError: Request rejected because ID based filter did not match');
		throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
	}

	// All the easy checks have been performed, go ahead and run the filter against the DB
	const where = {
		_and: [{ [primaryKeyField]: id }, accessFilter],
	};

	try {
		const { provider } = graphweaverMetadata.getEntityByName(entityName) ?? {};
		if (!provider) {
			logger.trace(
				`Entity '${entityName}' has no configured provider. Can't check in DB, so this user is not allowed to access the record. If you want to allow access for this entity, it either needs a provider, or it needs to use a simple filter.`
			);
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}

		const result = await provider?.findOne(where);
		if (!result) {
			logger.trace('Raising ForbiddenError: User is not allowed to access this record');
			throw new ForbiddenError(GENERIC_AUTH_ERROR_MESSAGE);
		}
	} catch (error) {
		logger.error('Error while checking entity permissions', error);
		if ((error as any).message === GENERIC_AUTH_ERROR_MESSAGE) {
			throw error;
		}
		throw new Error('An unexpected error has occurred');
	}
}

export async function checkAuthorization<G = unknown>(
	entityName: string,
	id: string | number,
	requestInput: Partial<G>,
	requiredPermission: AccessType
) {
	// Get ACL first
	const acl = getACL(entityName);
	const meta = graphweaverMetadata.getEntityByName(entityName);

	// Check whether the user can perform the request type of action at all,
	// before evaluating any (more expensive) permissions filters
	await assertUserCanPerformRequestedAction(acl, requiredPermission);

	// Now check whether the root entity passes permissions filters (if set)
	await checkEntityPermission(entityName, id, requiredPermission);

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

		// If we are here then we have an array or an object. Let's see if its a related entity.
		const relatedEntity = meta?.fields[key]?.getType();
		const relatedEntityMetadata = graphweaverMetadata.metadataForType(relatedEntity);

		if (isEntityMetadata(relatedEntityMetadata)) {
			// Now we have a related entity, let's check and make sure we have permission
			const accessType = requiredPermissionsForAction(value);
			const values = Array.isArray(value) ? value : [value];
			for (const item of values) {
				const relatedId = item[relatedEntityMetadata.primaryKeyField ?? 'id'];

				// We only check the nested inputs with ID's, this is because if there was no ID
				// supplied in the input args then the entity has been created in the data source.
				// The creation hook will triggered for that entity and the permissions checked
				if (relatedId) {
					relatedEntityAuthChecks.push(
						checkAuthorization(relatedEntityMetadata.name, relatedId, item, accessType)
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
