import Graphweaver from '@exogee/graphweaver-server';
import { authApolloPlugin } from '@exogee/graphweaver-auth';

import './schema';
import { addUserToContext, afterRead, beforeRead } from './auth';

export const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(addUserToContext, { implicitAllow: true })],
	},

	adminMetadata: {
		enabled: true,
		hooks: {
			// These hooks filter the admin ui entities based on the logged in user
			beforeRead,
			afterRead,
		},
	},
});
