import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';

import { AccountResolver, ProfitAndLossRowResolver, TenantResolver } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

const graphweaver = new Graphweaver({
	resolvers: [AccountResolver, ProfitAndLossRowResolver, TenantResolver],
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
