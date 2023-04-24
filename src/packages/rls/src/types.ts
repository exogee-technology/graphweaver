import { Filter } from '@exogee/graphweaver';

// Consumers will extend the base context type
export type AuthorizationContext = {
	roles?: string[];
};

export enum AccessType {
	Read = 'Read',
	Create = 'Create',
	Update = 'Update',
	Delete = 'Delete',
}

export const BASE_ROLE_EVERYONE = 'Everyone';

export type AccessControlList<T> = {
	[K in string]?: AccessControlEntry<T>;
};

export interface AccessControlEntry<T> {
	read?: AccessControlValue<T>;
	create?: AccessControlValue<T>;
	update?: AccessControlValue<T>;
	delete?: AccessControlValue<T>;
	write?: AccessControlValue<T>;
	all?: AccessControlValue<T>;
}

export type ConsolidatedAccessControlEntry<T> = {
	[K in AccessType]?: ConsolidatedAccessControlValue<T>;
};

export type AccessControlValue<G> = true | FilterFunction<G>;
export type ConsolidatedAccessControlValue<G> = true | FilterFunction<G>[];
export type FilterFunction<G> = (context: AuthorizationContext) => Filter<G> | Promise<Filter<G>>;
