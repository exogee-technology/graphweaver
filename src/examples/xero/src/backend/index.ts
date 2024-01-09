import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { resolvers } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

export const graphweaver = new Graphweaver({
	resolvers,
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});

export const handler = graphweaver.handler();
