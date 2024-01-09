import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext } from '@exogee/graphweaver-auth';

import { resolvers } from './schema';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
});

export const handler = graphweaver.handler();
