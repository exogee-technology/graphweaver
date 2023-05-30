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
} from '@exogee/graphweaver-auth';
import { BaseLoaders } from '@exogee/graphweaver';
import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { UserResolver, User } from './schema/user';
import { TaskResolver } from './schema/task';
import { TagResolver } from './schema/tag';
import { myConnection } from './database';

export interface Context extends AuthorizationContext {
	user: User;
}

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

const resolvers = [TaskResolver, TagResolver, UserResolver];

const graphweaver = new Graphweaver<Context>({
	resolvers,
	apolloServerOptions: {
		introspection: isOffline,
		plugins: [connectToDatabase(myConnection), ClearDatabaseContext],
	},
	adminMetadata: { enabled: true },
});

setAdministratorRoleName('ADMINISTRATOR');

export const handler = startServerAndCreateLambdaHandler<any, Context>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler(),
	{
		context: async ({ event }: LambdaContextFunctionArgument<any>) => {
			// Let's use the x-user-id to specify a different user for testing
			// In a real world application this would be inside an access token
			const userId = (event as any)?.headers?.['x-user-id'] ?? '1';

			const user = User.fromBackendEntity(
				await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
			);

			if (!user) throw new Error('Bad Request: Unknown user id provided.');

			const context: Context = {
				user,
				// If the user id is 4 this is Darth Vader and we return the dark side role
				roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
			};

			upsertAuthorizationContext(context);
			return context;
		},
	}
);
