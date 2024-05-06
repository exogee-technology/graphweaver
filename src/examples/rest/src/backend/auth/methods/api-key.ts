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

const acl: AccessControlList<ApiKeyEntity<ApiKeyStorage<Roles>>, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

export const apiKey = new ApiKey({
	provider: new MikroBackendProvider(OrmApiKey, myConnection),
	acl,
	roles: Roles,
});
