import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';

import { mikroOrmEntities } from './entities';
import { UserResolver } from './schema/user';

const graphweaver = new Graphweaver({
	resolvers: [UserResolver],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
	},
	adminMetadata: { enabled: true },

	mikroOrmOptions: { mikroOrmConfig: { entities: mikroOrmEntities, dbName: 'todo_app' } },
});

exports.handler = startServerAndCreateLambdaHandler(graphweaver.server);
