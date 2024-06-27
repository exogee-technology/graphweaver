import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, authApolloPlugin } from '@exogee/graphweaver-auth';

import './schema';
import { traceProvider } from './schema/trace';
// Auth Functions
import { beforeRead, afterRead, addUserToContext } from './auth';

// API Key Data Provider
import { apiKeyDataProvider } from './auth';

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
		traceProvider,
		instrumentations: [],
	},
});

export const handler = graphweaver.handler();
