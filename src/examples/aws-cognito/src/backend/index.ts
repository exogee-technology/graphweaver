import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext, authApolloPlugin } from '@exogee/graphweaver-auth';

import { resolvers } from './schema';

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
});

export const handler = graphweaver.handler();
