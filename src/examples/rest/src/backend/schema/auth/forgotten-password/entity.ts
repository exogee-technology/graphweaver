import {
	AccessControlList,
	AuthorizationContext,
	ForgottenPasswordLinkData,
	createAuthenticationEntity,
} from '@exogee/graphweaver-auth';
import { Authentication as OrmAuthentication } from '../../../entities';

const acl: AccessControlList<OrmAuthentication<ForgottenPasswordLinkData>, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own Authentications
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any Authentications
		all: true,
	},
};

export const ForgottenPasswordLink =
	createAuthenticationEntity<OrmAuthentication<ForgottenPasswordLinkData>>(acl);
