import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { AlbumResolver } from './schema/album';

import { connections } from './database';

const graphweaver = new Graphweaver({
	resolvers: [AlbumResolver],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
		plugins: [connectToDatabase(connections), ClearDatabaseContext],
	},
	adminMetadata: { enabled: true },
});

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
