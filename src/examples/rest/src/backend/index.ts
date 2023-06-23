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

import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { UserResolver, User } from './schema/user';
import { TaskResolver } from './schema/task';
import { TagResolver } from './schema/tag';
import { AuthResolver } from './schema/auth';

import { myConnection } from './database';

// Auth Functions
import { addUserToContext } from './auth/context';
import { beforeRead, afterRead } from './auth/admin-ui';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

export const resolvers = [TaskResolver, TagResolver, UserResolver, AuthResolver];

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		introspection: isOffline,
		plugins: [
			localAuthApolloPlugin(addUserToContext),
			connectToDatabase(myConnection),
			ClearDatabaseContext,
		],
	},
	adminMetadata: {
		enabled: true,
		hooks: {
			beforeRead,
			afterRead,
		},
	},
});

setAdministratorRoleName('ADMINISTRATOR');

export const handler = startServerAndCreateLambdaHandler<any>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
