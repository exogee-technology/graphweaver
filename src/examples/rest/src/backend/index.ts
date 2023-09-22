import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, AuthApolloPlugin } from '@exogee/graphweaver-auth';

import { resolvers } from './schema';
// Auth Functions
import { beforeRead, afterRead } from './auth/admin-ui';
import { addUserToContext } from './auth/context';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		plugins: [AuthApolloPlugin(addUserToContext)],
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

export const handler = graphweaver.handler();
