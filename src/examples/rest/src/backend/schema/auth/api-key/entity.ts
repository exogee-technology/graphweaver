import {
	AccessControlList,
	ApiKey,
	AuthorizationContext,
	createApiKeyEntity,
} from '@exogee/graphweaver-auth';
import { ApiKey as OrmApiKey } from '../../../entities';

const acl: AccessControlList<ApiKey<OrmApiKey>, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

export const apiKey = createApiKeyEntity<OrmApiKey>(acl);
