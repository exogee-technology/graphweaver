import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { resolvers } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

const graphweaver = new Graphweaver({
	resolvers,
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});

exports.handler = graphweaver.handler();
