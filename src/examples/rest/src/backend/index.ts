import dotenv from 'dotenv';
import * as path from 'path';
const isOffline = process.env.IS_OFFLINE === 'true';
const envPath = isOffline ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});
import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import {
	AuthorizationContext,
	localAuthApolloPlugin,
	setAdministratorRoleName,
} from '@exogee/graphweaver-auth';
import { MySqlDriver } from '@mikro-orm/mysql';

import { Task, Tag } from './entities';

import { UserResolver, User } from './schema/user';
import { TaskResolver } from './schema/task';
import { TagResolver } from './schema/tag';
import { AuthResolver, getUserProfile } from './schema/auth';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const resolvers = [TaskResolver, TagResolver, UserResolver, AuthResolver];

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		introspection: isOffline,
		plugins: [localAuthApolloPlugin(getUserProfile)],
	},
	adminMetadata: { enabled: true },
	mikroOrmOptions: [
		{
			connectionManagerId: 'my-sql',
			mikroOrmConfig: {
				entities: [Task, Tag],
				driver: MySqlDriver,
				dbName: 'todo_app',
				user: process.env.MYSQL_USERNAME,
				password: process.env.MYSQL_PASSWORD,
				port: 3306,
			},
		},
	],
});

setAdministratorRoleName('ADMINISTRATOR');

export const handler = startServerAndCreateLambdaHandler<any>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
