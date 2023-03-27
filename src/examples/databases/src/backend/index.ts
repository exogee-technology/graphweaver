import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { MySqlDriver } from '@mikro-orm/mysql';

import { Task, User } from './entities';

import { UserResolver } from './schema/user';
import { TaskResolver } from './schema/task';

const graphweaver = new Graphweaver({
	resolvers: [TaskResolver, UserResolver],
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
	},
	adminMetadata: { enabled: true },

	mikroOrmOptions: [
		{
			mikroOrmConfig: {
				entities: [User],
				dbName: 'todo_app',
			},
		},
		{
			mikroOrmConfig: {
				entities: [Task],
				driver: MySqlDriver,
				dbName: 'todo_app',
				user: 'root',
				password: '',
				port: 3306,
			},
		},
	],
});

exports.handler = startServerAndCreateLambdaHandler(graphweaver.server, {});
