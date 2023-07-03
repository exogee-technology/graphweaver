import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { resolvers } from './schema';
import { connections } from './database';

const graphweaver = new Graphweaver({
	resolvers,
	apolloServerOptions: {
		introspection: true,
		plugins: [connectToDatabase(connections), ClearDatabaseContext],
	},
	adminMetadata: { enabled: true },
});

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
