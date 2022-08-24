"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateConsolidatedAccessControlValue = exports.andFilters = exports.buildAccessControlEntryForUser = exports.getRolesFromAuthorizationContext = exports.clearAuthorizationContext = exports.upsertAuthorizationContext = exports.getAdministratorRoleName = exports.setAdministratorRoleName = void 0;
const logger_1 = require("../logger");
const types_1 = require("../common/types");
let authContext;
let administratorRoleName = '';
const isEmptyObject = (candidate) => {
    return (candidate &&
        Object.keys(candidate).length === 0 &&
        Object.getPrototypeOf(candidate) === Object.prototype);
};
const titleCase = (input) => input.charAt(0).toUpperCase() + input.slice(1);
const mapOperation = (operationName) => {
    const result = types_1.AccessType[titleCase(operationName)];
    if (result === undefined) {
        logger_1.logger.error(`Could not map invalid operation name: ${operationName}`);
        throw new Error(types_1.GENERIC_AUTH_ERROR_MESSAGE);
    }
    return result;
};
function setAdministratorRoleName(roleName) {
    administratorRoleName = roleName;
}
exports.setAdministratorRoleName = setAdministratorRoleName;
function getAdministratorRoleName() {
    if (!administratorRoleName) {
        logger_1.logger.error('Administrator role name was not set');
        throw new Error(types_1.GENERIC_AUTH_ERROR_MESSAGE);
    }
    return administratorRoleName;
}
exports.getAdministratorRoleName = getAdministratorRoleName;
function upsertAuthorizationContext(context) {
    if (authContext === undefined)
        authContext = {};
    Object.assign(authContext, context);
}
exports.upsertAuthorizationContext = upsertAuthorizationContext;
function clearAuthorizationContext() {
    authContext = undefined;
}
exports.clearAuthorizationContext = clearAuthorizationContext;
function getRolesFromAuthorizationContext() {
    if (!authContext) {
        throw new Error('Authorization context not set');
    }
    if (!Array.isArray(authContext.roles) || authContext.roles.length === 0) {
        throw new Error('Currently logged in user has no roles');
    }
    return authContext.roles;
}
exports.getRolesFromAuthorizationContext = getRolesFromAuthorizationContext;
/**
 * @param base The access control value to be used as a starting value
 * @param candidate The access control value to be combined with the base value
 * @returns the permissions contained within the candidate value
 * to the existing value provided and returns a single, new
 * access control value
 */
const consolidateAccessControlValue = (base, candidate) => {
    // True is the broadest possible permission already, leave as is
    // Likewise, if the new value is true, set and return
    if (base === true || candidate === true)
        return true;
    // If the new value is a function, add it to an array of filters
    if (typeof candidate === 'function') {
        if (Array.isArray(base)) {
            // Add to the existing array of filter functions
            base.push(candidate);
            return base;
        }
        else {
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
const buildAccessControlEntryForUser = (acl, roles) => {
    // If this is a super user, return an object representing full access
    if (roles.includes(getAdministratorRoleName())) {
        return {
            [types_1.AccessType.Read]: true,
            [types_1.AccessType.Create]: true,
            [types_1.AccessType.Update]: true,
            [types_1.AccessType.Delete]: true,
        };
    }
    // Build a new AccessControlEntry representing the combined permission represented by all the roles
    // the user belongs to
    const consideredRoles = [...roles, types_1.BASE_ROLE_EVERYONE];
    const consolidatedAccessControlEntry = consideredRoles.reduce((result, role) => {
        const entry = acl[role];
        if (!entry) {
            return result;
        }
        Object.entries(entry).forEach(([operation, value]) => {
            if (!['read', 'create', 'update', 'delete', 'write', 'all'].includes(operation))
                throw new Error('Encountered invalid ACL');
            // Keep updating the result until all the roles + operations within the roles have been considered
            const ops = [];
            if (operation === 'write') {
                ops.push(...['create', 'update', 'delete']);
            }
            else if (operation === 'all') {
                ops.push(...['read', 'create', 'update', 'delete']);
            }
            else {
                ops.push(operation);
            }
            ops.forEach((op) => (result[mapOperation(op)] = consolidateAccessControlValue(result[op], value)));
        });
        return result;
    }, {});
    return consolidatedAccessControlEntry;
};
exports.buildAccessControlEntryForUser = buildAccessControlEntryForUser;
/**
 * @param filters The list of individual filters to be combined into a single 'anded' filter
 * @returns A single filter object imposing all of the input filter conditions together
 */
const andFilters = (...filters) => {
    const nonEmptyFilters = filters.filter((filter) => !isEmptyObject(filter) && filter !== undefined && filter !== null);
    console.log(`NonEmpty Filters: ${JSON.stringify(nonEmptyFilters)}`);
    return nonEmptyFilters.length > 1 ? { ['_and']: [nonEmptyFilters] } : nonEmptyFilters[0];
};
exports.andFilters = andFilters;
/**
 * Evaluates any filters in an access control value and returns the resulting query filter
 *
 * @param consolidatedAccessControlValue The access control value to be used as the input
 * @returns The resultant query filter should be applied in the request to the data provider
 */
const evaluateConsolidatedAccessControlValue = async (consolidatedAccessControlValue) => {
    if (consolidatedAccessControlValue === true) {
        // Return an unconditional filter
        return {};
    }
    else if (Array.isArray(consolidatedAccessControlValue) &&
        consolidatedAccessControlValue.length > 0) {
        logger_1.logger.trace(`Got permission filters: `, consolidatedAccessControlValue);
        // Evaluate each filter function
        const evaluatedFilters = consolidatedAccessControlValue.map((filter) => {
            if (!authContext) {
                throw new Error('Authorisation context provider not initialised');
            }
            return filter(authContext);
        });
        // Apply to original search criteria
        return evaluatedFilters.length > 1 ? { _or: evaluatedFilters } : evaluatedFilters[0];
    }
    else {
        logger_1.logger.error('Raising ForbiddenError: Unexpected error processing filter based access');
        throw new Error(types_1.GENERIC_AUTH_ERROR_MESSAGE);
    }
};
exports.evaluateConsolidatedAccessControlValue = evaluateConsolidatedAccessControlValue;
