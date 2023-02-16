import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { logger } from '@exogee/logger';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';

import { AccountResolver, ProfitAndLossRowResolver, TenantResolver } from './schema';
import { context } from './context';

logger.info(`example-xero start Graphweaver`);
const graphweaver = new Graphweaver({
	resolvers: [AccountResolver, ProfitAndLossRowResolver, TenantResolver],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
	},
	adminMetadata: { enabled: true },

	// TODO: Remove
	mikroOrmOptions: {},
});
logger.info(`example-xero graphweaver.server start`);

exports.handler = startServerAndCreateLambdaHandler(graphweaver.server, { context });
