import {
	AccessControlList,
	ApiKey,
	ApiKeyEntity,
	ApiKeyStorage,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { ApiKey as OrmApiKey } from '../../entities/mysql';
import { myConnection } from '../../database';
import { Roles } from '../roles';

const acl: AccessControlList<ApiKeyEntity<ApiKeyStorage<Roles>, Roles>, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

export const apiKeyDataProvider = new MikroBackendProvider(OrmApiKey, myConnection);

export const apiKey = new ApiKey({
	provider: apiKeyDataProvider,
	acl,
	roles: Roles,
});
