import dotenv from 'dotenv';
import * as path from 'path';
const isOffline = process.env.IS_OFFLINE === 'true';
const envPath = isOffline ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});
import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { MySqlDriver } from '@mikro-orm/mysql';

import { Task } from './entities';

import { PersonResolver } from './schema/person';
import { TaskResolver } from './schema/task';

const graphweaver = new Graphweaver({
	resolvers: [TaskResolver, PersonResolver],
	apolloServerOptions: {
		introspection: isOffline,
	},
	adminMetadata: { enabled: true },

	mikroOrmOptions: [
		{
			connectionManagerId: 'my-sql',
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
