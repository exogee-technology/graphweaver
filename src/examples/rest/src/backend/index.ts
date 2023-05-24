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
	ForbiddenError,
	AuthorizationContext,
	localAuthApolloPlugin,
	setAdministratorRoleName,
} from '@exogee/graphweaver-auth';
import { MySqlDriver } from '@mikro-orm/mysql';

import { Task, Tag } from './entities';

import { UserResolver } from './schema/user';
import { TaskResolver } from './schema/task';
import { TagResolver } from './schema/tag';
import { AuthResolver } from './schema/auth';
import { addUserToContext } from './auth/context';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const resolvers = [TaskResolver, TagResolver, UserResolver, AuthResolver];

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		introspection: isOffline,
		plugins: [localAuthApolloPlugin(addUserToContext)],
	},
	adminMetadata: {
		enabled: true,
		hooks: {
			beforeRead: (context: AuthorizationContext) => {
				// Ensure only logged in users can access the admin ui metadata
				if (!context.token) throw new ForbiddenError('Forbidden');
			},
		},
	},
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
