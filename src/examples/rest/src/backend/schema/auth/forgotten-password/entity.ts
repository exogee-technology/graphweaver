import { ForgottenPasswordLinkData, createAuthenticationEntity } from '@exogee/graphweaver-auth';
import { Authentication as OrmAuthentication } from '../../../entities';

export class ForgottenPasswordLink extends createAuthenticationEntity<
	OrmAuthentication<ForgottenPasswordLinkData>
>({
	LIGHT_SIDE: {
		// Users can only perform read operations on their own Authentications
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any Authentications
		all: true,
	},
}) {}
