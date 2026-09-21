import {
	AccessControlList,
	ApiKey,
	ApiKeyEntity,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { Roles } from '../roles';

const acl: AccessControlList<ApiKeyEntity<Roles>, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

export { apiKeyProvider as apiKeyDataProvider } from '../storage';
import { apiKeyProvider as apiKeyDataProvider } from '../storage';

export const apiKey = new ApiKey<Roles>({
	provider: apiKeyDataProvider,
	acl,
	roles: Roles,
});
