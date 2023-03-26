import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';

const graphweaver = new Graphweaver({
	resolvers: [],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
	},
	adminMetadata: { enabled: true },

	// TODO: Remove
	mikroOrmOptions: {},
});

exports.handler = startServerAndCreateLambdaHandler(graphweaver.server);
