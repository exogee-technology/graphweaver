import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';

import { mikroOrmEntities } from './entities';
import { UserResolver } from './schema/user';
import { TaskResolver } from './schema/task';

const graphweaver = new Graphweaver({
	resolvers: [TaskResolver, UserResolver],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
	},
	adminMetadata: { enabled: true },

	mikroOrmOptions: {
		mikroOrmConfig: {
			entities: mikroOrmEntities,
			dbName: 'todo_app',
			user: 'root',
			password: '',
			port: 3306,
		},
	},
});

exports.handler = startServerAndCreateLambdaHandler(graphweaver.server, {});
