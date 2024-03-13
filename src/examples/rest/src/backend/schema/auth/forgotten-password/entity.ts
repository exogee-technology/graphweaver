import {
	AccessControlList,
	ApplyAccessControlList,
	Authentication,
	AuthorizationContext,
	ForgottenPasswordLinkData,
} from '@exogee/graphweaver-auth';
import { ObjectType } from '@exogee/graphweaver';

import { Authentication as OrmAuthentication } from '../../../entities';

const acl: AccessControlList<ForgottenPasswordLink, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own Authentications
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any Authentications
		all: true,
	},
};
@ApplyAccessControlList(acl)
@ObjectType('ForgottenPasswordLink')
export class ForgottenPasswordLink extends Authentication<
	OrmAuthentication<ForgottenPasswordLinkData>
> {}
