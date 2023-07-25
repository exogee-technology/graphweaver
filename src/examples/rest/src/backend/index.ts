import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { AuthorizationContext, localAuthApolloPlugin } from '@exogee/graphweaver-auth';

import { resolvers } from './schema';
// Auth Functions
import { addUserToContext } from './auth/context';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		plugins: [localAuthApolloPlugin(addUserToContext)],
	},
});

export const handler = graphweaver.handler();
