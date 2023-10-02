import { logger } from '@exogee/logger';
import { Filter } from '@exogee/graphweaver';

import {
	AccessControlList,
	AccessControlValue,
	AccessType,
	AuthorizationContext,
	BASE_ROLE_EVERYONE,
	ConsolidatedAccessControlEntry,
	ConsolidatedAccessControlValue,
	JwtPayload,
	MultiFactorAuthentication,
	MultiFactorAuthenticationRule,
	AuthenticationMethod,
} from './types';
import { GENERIC_AUTH_ERROR_MESSAGE } from './auth-utils';
import { ChallengeError } from './errors';
import { getRulesForRoles } from './utils/get-rules-for-roles';

type AuthContext<T extends AuthorizationContext | undefined> = T;
let authContext: AuthContext<undefined> | AuthContext<AuthorizationContext> = undefined;

const DEFAULT_ADMIN_ROLE_NAME = 'ADMINISTRATOR';
let administratorRoleName = DEFAULT_ADMIN_ROLE_NAME;

export const AclMap = new Map<string, Partial<AccessControlList<any, any>>>();

const isEmptyObject = (candidate: any) => {
	return (
		candidate &&
		Object.keys(candidate).length === 0 &&
		Object.getPrototypeOf(candidate) === Object.prototype
	);
};

const titleCase = (input: string) => input.charAt(0).toUpperCase() + input.slice(1);

const mapOperation = (operationName: string): AccessType => {
	const result = AccessType[titleCase(operationName) as AccessType];
	if (result === undefined) {
		logger.error(`Could not map invalid operation name: ${operationName}`);
		throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
	}
	return result;
};

export function setAdministratorRoleName(roleName: string) {
	administratorRoleName = roleName;
}

export function getAdministratorRoleName() {
	if (administratorRoleName === DEFAULT_ADMIN_ROLE_NAME) {
		logger.warn(
			`The default administrator role name is being used. Please set a custom administrator role name using the setAdministratorRoleName function.`
		);
	}
	return administratorRoleName;
}

export function upsertAuthorizationContext(context: AuthorizationContext) {
	if (authContext === undefined) authContext = {};
	Object.assign(authContext, context);
}

export function clearAuthorizationContext() {
	authContext = undefined;
}

export function getRolesFromAuthorizationContext() {
	if (!authContext) {
		throw new Error('Authorization context not set');
	}
	if (
		!authContext.user?.roles ||
		!Array.isArray(authContext.user?.roles) ||
		authContext.user?.roles.length === 0
	) {
		throw new Error('Currently logged in user has no roles');
	}
	return authContext.user.roles;
}

/**
 * @param base The access control value to be used as a starting value
 * @param candidate The access control value to be combined with the base value
 * @returns the permissions contained within the candidate value
 * to the existing value provided and returns a single, new
 * access control value
 */
const consolidateAccessControlValue = <G, TContext extends AuthorizationContext>(
	base: AccessControlValue<G, TContext>,
	candidate: AccessControlValue<G, TContext>
): ConsolidatedAccessControlValue<G, TContext> | undefined => {
	// True is the broadest possible permission already, leave as is
	// Likewise, if the new value is true, set and return
	if (base === true || candidate === true) return true;

	// If the new value is a function, add it to an array of filters
	if (typeof candidate === 'function') {
		if (Array.isArray(base)) {
			// Add to the existing array of filter functions
			base.push(candidate);
			return base;
		} else {
			// Otherwise create a new single item array
			return [candidate];
		}
	}

	return undefined;
};

/**
 * @param acl The access control list for the entity being assessed
 * @param roles The list of roles pertaining to the authorised user
 * @returns A single access control entry representing the combined access permissions
 * across all the roles the user belongs to
 */
export const buildAccessControlEntryForUser = <G, TContext extends AuthorizationContext>(
	acl: Partial<AccessControlList<G, TContext>>,
	roles: string[]
): ConsolidatedAccessControlEntry<G, TContext> => {
	// If this is a super user, return an object representing full access
	if (roles.includes(getAdministratorRoleName())) {
		return {
			[AccessType.Read]: true,
			[AccessType.Create]: true,
			[AccessType.Update]: true,
			[AccessType.Delete]: true,
		};
	}

	// Build a new AccessControlEntry representing the combined permission represented by all the roles
	// the user belongs to
	const consideredRoles: string[] = [...roles, BASE_ROLE_EVERYONE];
	const consolidatedAccessControlEntry = consideredRoles.reduce((result, role) => {
		const entry = acl[role];
		if (!entry) {
			return result;
		}

		Object.entries(entry).forEach(([operation, value]) => {
			if (!['read', 'create', 'update', 'delete', 'write', 'all'].includes(operation))
				throw new Error('Encountered invalid ACL');

			// Keep updating the result until all the roles + operations within the roles have been considered
			const ops = [] as any[];
			if (operation === 'write') {
				ops.push(...['create', 'update', 'delete']);
			} else if (operation === 'all') {
				ops.push(...['read', 'create', 'update', 'delete']);
			} else {
				ops.push(operation);
			}

			ops.forEach(
				(op) => (result[mapOperation(op)] = consolidateAccessControlValue(result[op], value))
			);
		});
		return result;
	}, {} as any);

	return consolidatedAccessControlEntry;
};

/**
 * @param filters The list of individual filters to be combined into a single 'anded' filter
 * @returns A single filter object imposing all of the input filter conditions together
 */
export const andFilters = <G>(...filters: (Filter<G> | undefined)[]): Filter<G> => {
	const nonEmptyFilters = filters.filter(
		(filter): filter is Filter<G> =>
			!isEmptyObject(filter) && filter !== undefined && filter !== null
	);
	console.log(`NonEmpty Filters: ${JSON.stringify(nonEmptyFilters)}`);

	return nonEmptyFilters.length > 1 ? { _and: nonEmptyFilters } : nonEmptyFilters[0];
};

/**
 * Evaluates any filters in an access control value and returns the resulting query filter
 *
 * @param accessControlValue The access control value to be used as the input
 * @returns The resultant query filter should be applied in the request to the data provider
 */
export const evaluateAccessControlValue = async <G, TContext extends AuthorizationContext>(
	consolidatedAccessControlValue: ConsolidatedAccessControlValue<G, TContext>
): Promise<Filter<G>> => {
	if (consolidatedAccessControlValue === true) {
		// Return an unconditional filter
		return {};
	} else if (
		Array.isArray(consolidatedAccessControlValue) &&
		consolidatedAccessControlValue.length > 0
	) {
		logger.trace(`Got permission filters: `, consolidatedAccessControlValue);

		// Evaluate each filter function
		const evaluatedFilters = await Promise.all(
			consolidatedAccessControlValue.map((filter) => {
				if (!authContext) {
					throw new Error('Authorisation context provider not initialised');
				}
				return filter(authContext as TContext);
			})
		);

		// Apply to original search criteria
		return evaluatedFilters.length > 1 ? { _or: evaluatedFilters } : evaluatedFilters[0];
	} else {
		logger.error('Raising ForbiddenError: Unexpected error processing filter based access');
		throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
	}
};

export const requireEnvironmentVariable = (envStr: string): string => {
	const envVar = process.env[envStr];
	if (!envVar) {
		throw new Error(`${envStr} required but not found.`);
	}
	return envVar;
};

const filterValidMFA = (
	rule: MultiFactorAuthenticationRule,
	key: AuthenticationMethod,
	expiresIn: number,
	timestamp: number
) => {
	if (rule.providers) return timestamp < expiresIn && rule.providers.includes(key);
	return timestamp < expiresIn;
};

export const checkAuthentication = async (
	mfa: MultiFactorAuthentication,
	operation: AccessType,
	token?: string | JwtPayload
) => {
	if (!token) throw new Error('Authentication Error: Expected Token.');
	if (typeof token === 'string') throw new Error('Authentication Error: Expected JWT Payload.');

	// Check the roles of the logged in user
	const roles = getRolesFromAuthorizationContext();
	// Get the rules associated with the users roles
	const rules = getRulesForRoles(mfa, roles, operation);

	// No rules found for the current user role, it is safe to continue
	if (rules.length === 0) return;

	// Get existing mfa authentications in the token
	const tokenMfaValues = Object.entries(token?.acr?.values ?? {}) as [
		AuthenticationMethod,
		number
	][];
	// Let's get the current timestamp to check if any mfa has expired
	const timestamp = Math.floor(Date.now() / 1000);

	// Loop through each rule and make sure it passes, throw when we find one that fails.
	for (const rule of rules) {
		// Let's check for recent mfa step ups in the token that match the rule
		const validMFAFound = tokenMfaValues.filter(([key, expiresIn]) =>
			filterValidMFA(rule, key, expiresIn, timestamp)
		);

		// If we find less then the number of required then we need to throw a challenge error
		if (validMFAFound.length < rule.factorsRequired) {
			throw new ChallengeError(
				'MFA Challenge Required: Operation requires a step up in your authentication.',
				{
					providers: rule.providers,
				}
			);
		}
	}
};
