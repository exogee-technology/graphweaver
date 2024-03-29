import {
	AccessControlList,
	AuthorizationContext,
	createCredentialEntity,
} from '@exogee/graphweaver-auth';
import { Credential as OrmCredential } from '../../../entities';

const acl: AccessControlList<Credential, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own credentials
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any credentials
		all: true,
	},
};

export const Credential = createCredentialEntity<OrmCredential>(acl);
