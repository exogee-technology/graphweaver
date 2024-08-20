import { BaseContext, Filter } from '@exogee/graphweaver';
import { UserProfile } from './user-profile';

export enum AuthenticationMethod {
	PASSWORD = 'pwd',
	MAGIC_LINK = 'mgl',
	ONE_TIME_PASSWORD = 'otp',
	WEB3 = 'wb3',
	PASSKEY = 'pky',
}

export interface JwtPayload extends Record<string, unknown> {
	sub?: string;
	iat?: number;
	exp?: number;
	amr?: AuthenticationMethod[];
	acr?: {
		values: { [K in AuthenticationMethod]: number };
	};
}

// Consumers will extend the base context type
export interface AuthorizationContext extends BaseContext {
	token?: string | JwtPayload;
	user?: UserProfile<unknown>;
	redirectUri?: URL;
}

export enum AccessType {
	Read = 'Read',
	Create = 'Create',
	Update = 'Update',
	Delete = 'Delete',
}

export const BASE_ROLE_EVERYONE = 'Everyone';

export class ListInputFilterArgs {} //extends BaseListInputFilterArgs {}

export type AccessControlList<G, TContext extends AuthorizationContext = AuthorizationContext> = {
	[K in string]?: AccessControlEntry<G, TContext>;
};

export type AccessControlEntry<G, TContext extends AuthorizationContext> = {
	read?: AccessControlValue<G, TContext>;
	create?: AccessControlValue<G, TContext>;
	update?: AccessControlValue<G, TContext>;
	delete?: DefaultAccessControlValue<G, TContext>;
	all?: AccessControlValue<G, TContext>;
	write?: AccessControlValue<G, TContext>;
};

export type ConsolidatedAccessControlEntry<G, TContext extends AuthorizationContext> = {
	[K in AccessType]?: ConsolidatedAccessControlValue<G, TContext>;
};

export type ConsolidatedFieldAccessControlEntry<G> = {
	[K in AccessType]?: Set<keyof G>;
};

export type SomeAccessControlValue<G, TContext extends AuthorizationContext> = {
	rowFilter: AccessControlValue<G, TContext>;
	fieldRestrictions?: AccessControlColumnValue<G, TContext>;
};

export type DefaultAccessControlValue<G, TContext extends AuthorizationContext> =
	| true
	| AccessControlFilterFunction<G, TContext>;

export type AccessControlColumnValue<G, TContext extends AuthorizationContext> =
	| (keyof G)[]
	| ((context: TContext) => (keyof G)[]);

export type AccessControlValue<G, TContext extends AuthorizationContext> =
	| DefaultAccessControlValue<G, TContext>
	| SomeAccessControlValue<G, TContext>;

export type AccessControlFilterFunctionResult<G> =
	| Filter<G>
	| Promise<Filter<G>>
	| boolean
	| Promise<boolean>;

export type AccessControlFilterFunction<G, TContext extends AuthorizationContext> = (
	context: TContext
) => AccessControlFilterFunctionResult<G>;

export type ConsolidatedAccessControlValue<G, TContext extends AuthorizationContext> =
	| true
	| AccessControlFilterFunction<G, TContext>[];

export type MultiFactorAuthentication = {
	[K in string]?: MultiFactorAuthenticationOperation;
};

export enum MultiFactorAuthenticationOperationType {
	READ = 'Read',
	CREATE = 'Create',
	UPDATE = 'Update',
	DELETE = 'Delete',
	WRITE = 'Write',
	ALL = 'All',
}

export type MultiFactorAuthenticationOperation = {
	[k in MultiFactorAuthenticationOperationType]?: MultiFactorAuthenticationRule[];
};

export type MultiFactorAuthenticationRule = {
	factorsRequired: number;
	providers: AuthenticationMethod[];
};

export enum AuthenticationType {
	PasskeyCredentialCreationOptions = 'PasskeyCredentialCreationOptions',
	PasskeyCredentialRequestOptions = 'PasskeyCredentialRequestOptions',
	PasskeyAuthenticatorDevice = 'PasskeyAuthenticatorDevice',
	Web3WalletAddress = 'Web3WalletAddress',
	OneTimePasswordChallenge = 'OneTimePasswordChallenge',
	MagicLinkChallenge = 'MagicLinkChallenge',
	ForgottenPasswordLink = 'ForgottenPasswordLink',
}
