import { BaseContext, Filter } from '@exogee/graphweaver';
import { UserProfile } from './user-profile';
import { AuthProvider } from './authentication';

export enum AuthenticationMethodReference {
	PASSWORD = 'pwd',
}

export type AuthenticationClassReference =
	`urn:gw:loa:${number}fa:${AuthenticationMethodReference}`;

export interface JwtPayload {
	iss?: string | undefined;
	sub?: string | undefined;
	aud?: string | string[] | undefined;
	exp?: number | undefined;
	nbf?: number | undefined;
	iat?: number | undefined;
	jti?: string | undefined;
	amr?: AuthenticationMethodReference[];
	acr?: {
		values: AuthenticationClassReference[];
	};
}

export type Token = string | JwtPayload;

// Consumers will extend the base context type
export interface AuthorizationContext extends BaseContext {
	token?: Token;
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

export interface MultiFactorAuthenticationOperation {
	read?: MultiFactorAuthenticationRule;
	create?: MultiFactorAuthenticationRule;
	update?: MultiFactorAuthenticationRule;
	delete?: MultiFactorAuthenticationRule;
	write?: MultiFactorAuthenticationRule;
	all?: MultiFactorAuthenticationRule;
}

export type MultiFactorAuthenticationRule = { factors: number; providers: AuthProvider[] }[];
