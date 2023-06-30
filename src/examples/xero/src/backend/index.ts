import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { logger } from '@exogee/logger';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';

import { AccountResolver, ProfitAndLossRowResolver, TenantResolver } from './schema';
import { XeroAuthApolloPlugin } from '@exogee/graphweaver-xero';

logger.info(`example-xero start Graphweaver`);
const graphweaver = new Graphweaver({
	resolvers: [AccountResolver, ProfitAndLossRowResolver, TenantResolver],
	apolloServerOptions: {
		plugins: [XeroAuthApolloPlugin],
	},
});
logger.info(`example-xero graphweaver.server start`);

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
