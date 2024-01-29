import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, authApolloPlugin } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { resolvers } from './schema';
// Auth Functions
import { beforeRead, afterRead } from './auth/admin-ui';
import { addUserToContext } from './auth/context';

// Auth Plugin Configuration
import { ApiKey } from './entities';
import { myConnection } from './database';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		plugins: [authApolloPlugin(addUserToContext, new MikroBackendProvider(ApiKey, myConnection))],
	},
	adminMetadata: {
		enabled: true,
		hooks: {
			// These hooks filter the admin ui entities based on the logged in user
			beforeRead,
			afterRead,
		},
	},
	fileAutoGenerationOptions: {
		typesOutputPath: ['./'],
	},
});

export const handler = graphweaver.handler();
