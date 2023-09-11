import { BaseContext, Filter } from '@exogee/graphweaver';
import { JwtPayload } from 'jsonwebtoken';
import { UserProfile } from './user-profile';
import { AuthProvider } from './authentication';

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

export type MultiFactorAuthentication<G> = {
	[K in string]?: MultiFactorAuthenticationOperation<G>;
};

export interface MultiFactorAuthenticationOperation<G> {
	read?: MultiFactorAuthenticationRule<G>;
	create?: MultiFactorAuthenticationRule<G>;
	update?: MultiFactorAuthenticationRule<G>;
	delete?: MultiFactorAuthenticationRule<G>;
	write?: MultiFactorAuthenticationRule<G>;
	all?: MultiFactorAuthenticationRule<G>;
}

export type MultiFactorAuthenticationRule<G> = { required: number; providers: AuthProvider[] }[];
