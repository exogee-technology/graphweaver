import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, localAuthApolloPlugin } from '@exogee/graphweaver-auth';
import { connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { resolvers } from './schema';
import { myConnection } from './database';
// Auth Functions
import { addUserToContext } from './auth/context';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		plugins: [localAuthApolloPlugin(addUserToContext), connectToDatabase(myConnection)],
	},
});

export const handler = graphweaver.handler();
