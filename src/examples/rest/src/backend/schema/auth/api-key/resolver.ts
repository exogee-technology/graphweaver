import { createApiKeyResolver } from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import { ApiKey as OrmApiKey } from '../../../entities/mysql';
import { apiKey } from './entity';

export const apiKeyDataProvider = new MikroBackendProvider(OrmApiKey, myConnection);

@Resolver()
export class ApiKeyAuthResolver extends createApiKeyResolver<OrmApiKey>(
	apiKey,
	apiKeyDataProvider
) {}
