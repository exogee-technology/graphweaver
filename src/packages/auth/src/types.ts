import { BaseContext, Filter } from '@exogee/graphweaver';
import { UserProfile } from './user-profile';

export enum AuthenticationMethod {
	PASSWORD = 'pwd',
}

export interface JwtPayload {
	id?: string;
	exp?: number;
	amr?: AuthenticationMethod[];
	acr?: {
		values: { [K in AuthenticationMethod]: number };
	};
}

// Consumers will extend the base context type
export interface AuthorizationContext extends BaseContext {
	token?: string | JwtPayload;
	user?: UserProfile;
}

export enum AccessType {
	Read = 'Read',
	Create = 'Create',
	Update = 'Update',
	Delete = 'Delete',
}

export const BASE_ROLE_EVERYONE = 'Everyone';

export type AccessControlList<G, TContext extends AuthorizationContext = AuthorizationContext> = {
	[K in string]?: AccessControlEntry<G, TContext>;
};

export interface AccessControlEntry<G, TContext extends AuthorizationContext> {
	read?: AccessControlValue<G, TContext>;
	create?: AccessControlValue<G, TContext>;
	update?: AccessControlValue<G, TContext>;
	delete?: AccessControlValue<G, TContext>;
	write?: AccessControlValue<G, TContext>;
	all?: AccessControlValue<G, TContext>;
}

export type ConsolidatedAccessControlEntry<G, TContext extends AuthorizationContext> = {
	[K in AccessType]?: ConsolidatedAccessControlValue<G, TContext>;
};

export type AccessControlValue<G, TContext extends AuthorizationContext> =
	| true
	| AccessControlFilterFunction<G, TContext>;

export type AccessControlFilterFunction<G, TContext extends AuthorizationContext> = (
	context: TContext
) => Filter<G> | Promise<Filter<G>>;

export type ConsolidatedAccessControlValue<G, TContext extends AuthorizationContext> =
	| true
	| AccessControlFilterFunction<G, TContext>[];

export type MultiFactorAuthentication = {
	[K in string]?: MultiFactorAuthenticationOperation;
};

export enum MultiFactorAuthenticationOperationType {
	READ = 'read',
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
	WRITE = 'write',
	ALL = 'all',
}

export type MultiFactorAuthenticationOperation = {
	[k in MultiFactorAuthenticationOperationType]?: MultiFactorAuthenticationRule[];
};

export type MultiFactorAuthenticationRule = {
	factorsRequired: number;
	providers: AuthenticationMethod[];
};
