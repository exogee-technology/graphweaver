import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { MySqlDriver } from '@mikro-orm/mysql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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
			connectionManagerId: 'pg',
			mikroOrmConfig: {
				entities: [User],
				driver: PostgreSqlDriver,
				dbName: 'todo_app',
				user: 'postgres',
				password: '',
				port: 5432,
			},
		},
		{
			connectionManagerId: 'my',
			mikroOrmConfig: {
				entities: [Task],
				driver: MySqlDriver,
				dbName: 'todo_app',
				user: 'root',
				password: 'password',
				port: 3306,
			},
		},
	],
});

exports.handler = startServerAndCreateLambdaHandler(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
