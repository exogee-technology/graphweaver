import { AccessControlList, AuthorizationContext, ConsolidatedAccessControlEntry, ConsolidatedAccessControlValue, QueryFilter } from '..';
export declare function setAdministratorRoleName(roleName: string): void;
export declare function getAdministratorRoleName(): string;
export declare function upsertAuthorizationContext(context: AuthorizationContext): void;
export declare function clearAuthorizationContext(): void;
export declare function getRolesFromAuthorizationContext(): string[];
/**
 * @param acl The access control list for the entity being assessed
 * @param roles The list of roles pertaining to the authorised user
 * @returns A single access control entry representing the combined access permissions
 * across all the roles the user belongs to
 */
export declare const buildAccessControlEntryForUser: (acl: AccessControlList<any>, roles: string[]) => ConsolidatedAccessControlEntry<any>;
/**
 * @param filters The list of individual filters to be combined into a single 'anded' filter
 * @returns A single filter object imposing all of the input filter conditions together
 */
export declare const andFilters: <T>(...filters: any[]) => Promise<any>;
/**
 * Evaluates any filters in an access control value and returns the resulting query filter
 *
 * @param consolidatedAccessControlValue The access control value to be used as the input
 * @returns The resultant query filter should be applied in the request to the data provider
 */
export declare const evaluateConsolidatedAccessControlValue: <T>(consolidatedAccessControlValue: ConsolidatedAccessControlValue<T>) => Promise<any>;
