import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';

import { resolvers } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

const graphweaver = new Graphweaver({
	resolvers: resolvers,
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
