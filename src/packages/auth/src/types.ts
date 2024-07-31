import { BaseContext, Filter } from '@exogee/graphweaver';
import { UserProfile } from './user-profile';

export enum AuthenticationMethod {
	PASSWORD = 'pwd',
	MAGIC_LINK = 'mgl',
	ONE_TIME_PASSWORD = 'otp',
	WEB3 = 'wb3',
	PASSKEY = 'pky',
}

export interface JwtPayload {
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

type ReadAccessControl<G, TContext extends AuthorizationContext> =
	| { read?: AccessControlValue<G, TContext>; readSome?: never }
	| { readSome?: SomeAccessControlValue<G, TContext>; read?: never };

type CreateAccessControl<G, TContext extends AuthorizationContext> =
	| { create?: AccessControlValue<G, TContext>; createSome?: never }
	| { createSome?: SomeAccessControlValue<G, TContext>; create?: never };

type UpdateAccessControl<G, TContext extends AuthorizationContext> =
	| { update?: AccessControlValue<G, TContext>; updateSome?: never }
	| { updateSome?: SomeAccessControlValue<G, TContext>; update?: never };

type DeleteAccessControl<G, TContext extends AuthorizationContext> = {
	delete?: AccessControlValue<G, TContext>;
};

type WriteAccessControl<G, TContext extends AuthorizationContext> =
	| { write?: AccessControlValue<G, TContext>; writeSome?: never }
	| { writeSome?: SomeAccessControlValue<G, TContext>; write?: never };

type AllAccessControl<G, TContext extends AuthorizationContext> =
	| { all?: AccessControlValue<G, TContext>; allSome?: never }
	| { allSome?: SomeAccessControlValue<G, TContext>; all?: never };

export type AccessControlEntry<G, TContext extends AuthorizationContext> = CreateAccessControl<
	G,
	TContext
> &
	ReadAccessControl<G, TContext> &
	UpdateAccessControl<G, TContext> &
	DeleteAccessControl<G, TContext> &
	WriteAccessControl<G, TContext> &
	AllAccessControl<G, TContext>;

export type ConsolidatedAccessControlEntry<G, TContext extends AuthorizationContext> = {
	[K in AccessType]?: ConsolidatedAccessControlValue<G, TContext>;
};

export type SomeAccessControlValue<G, TContext extends AuthorizationContext> = {
	rowFilter: AccessControlValue<G, TContext>;
	fields: AccessControlColumnValue<G, TContext>;
};

export type AccessControlColumnValue<G, TContext extends AuthorizationContext> =
	| (keyof G)[]
	| ((context: TContext) => (keyof G)[]);

export type AccessControlValue<G, TContext extends AuthorizationContext> =
	| true
	| AccessControlFilterFunction<G, TContext>;

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
