import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { AuthorizationContext, localAuthApolloPlugin } from '@exogee/graphweaver-auth';

import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { UserResolver, User } from './schema/user';
import { TaskResolver } from './schema/task';
import { TagResolver } from './schema/tag';
import { AuthResolver } from './schema/auth';

import { myConnection } from './database';

// Auth Functions
import { addUserToContext } from './auth/context';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const resolvers = [TaskResolver, TagResolver, UserResolver, AuthResolver];

const graphweaver = new Graphweaver<AuthorizationContext>({
	resolvers,
	apolloServerOptions: {
		plugins: [
			localAuthApolloPlugin(addUserToContext),
			connectToDatabase(myConnection),
			ClearDatabaseContext,
		],
	},
});

export const handler = startServerAndCreateLambdaHandler<any>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);
