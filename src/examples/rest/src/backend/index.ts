import dotenv from 'dotenv';
import * as path from 'path';
const isOffline = process.env.IS_OFFLINE === 'true';
const envPath = isOffline ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});
import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import {
	LambdaContextFunctionArgument,
	handlers,
	startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda';
import {
	AuthorizationContext,
	setAdministratorRoleName,
	upsertAuthorizationContext,
} from '@exogee/graphweaver-rls';
import { MySqlDriver } from '@mikro-orm/mysql';

import { Task } from './entities';

import { PersonResolver } from './schema/person';
import { TaskResolver } from './schema/task';

export interface Context extends AuthorizationContext {
	user: {
		id: string;
	};
}

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const graphweaver = new Graphweaver<Context>({
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

setAdministratorRoleName('ADMINISTRATOR');

export const handler = startServerAndCreateLambdaHandler<any, Context>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler(),
	{
		context: async ({ event }: LambdaContextFunctionArgument<any>) => {
			const context: Context = {
				user: {
					id: '1',
				},
				roles: [Roles.LIGHT_SIDE],
			};

			upsertAuthorizationContext(context);
			return context;
		},
	}
);
