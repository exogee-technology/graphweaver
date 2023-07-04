import Graphweaver from '@exogee/graphweaver-apollo';

import { resolvers } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

const graphweaver = new Graphweaver({
	resolvers: resolvers,
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});

exports.handler = graphweaver.handler();
