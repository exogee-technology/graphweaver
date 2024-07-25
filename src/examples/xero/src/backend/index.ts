import Graphweaver from '@exogee/graphweaver-server';

import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

import './schema';

export const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});
