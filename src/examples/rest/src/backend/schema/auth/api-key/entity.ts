import {
	AccessControlList,
	ApiKey as BaseApiKey,
	AuthorizationContext,
	createApiKeyEntity,
} from '@exogee/graphweaver-auth';
import { ApiKey as OrmApiKey } from '../../../entities';

const acl: AccessControlList<BaseApiKey<OrmApiKey>, AuthorizationContext> = {
	DARK_SIDE: {
		// Dark side user role can perform operations on any api keys
		all: true,
	},
};

export class ApiKey extends createApiKeyEntity<OrmApiKey>(acl) {}
