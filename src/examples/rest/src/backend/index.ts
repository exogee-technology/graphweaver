import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, authApolloPlugin } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import './schema';
// Auth Functions
import { beforeRead, afterRead, addUserToContext } from './auth';

// API Key Data Provider
import { apiKeyDataProvider } from './auth';
import { myConnection } from './database';
import { Trace } from './entities';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	apolloServerOptions: {
		plugins: [authApolloPlugin(addUserToContext, { apiKeyDataProvider })],
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
	openTelemetry: {
		traceProvider: new MikroBackendProvider(Trace, myConnection),
		instrumentations: [],
	},
});

export const handler = graphweaver.handler();
