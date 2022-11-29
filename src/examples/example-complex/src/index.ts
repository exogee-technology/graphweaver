import dotenv from 'dotenv';
import * as path from 'path';
const isOffline = process.env.IS_OFFLINE === 'true';
const envPath = isOffline ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});

import Graphweaver, {
	ApolloServerPluginLandingPageGraphQLPlayground,
} from '@exogee/graphweaver-apollo';
import 'reflect-metadata';

import { setAdministratorRoleName, upsertAuthorizationContext } from '@exogee/graphweaver';
import { HobbyResolver } from './schema/hobby';
import { UserResolver } from './schema/user';
import { BreederResolver } from './schema/breeder';
import { DogResolver } from './schema/dog';
import { SkillResolver } from './schema/skill';
import { UserDogResolver } from './schema/user-dog';
import { mikroOrmEntities } from './entities';
import { SetAuthenticatedUser } from './plugins/set-authenticated-user';
import { ApolloSession } from './plugins/apollo-session';
import { logger } from '@exogee/logger';

// Setup auth context
setAdministratorRoleName('Administrator');
upsertAuthorizationContext({ roles: ['Administrator'] });

const pluginsWithPlayground = isOffline
	? [
			ApolloSession,
			SetAuthenticatedUser,
			ApolloServerPluginLandingPageGraphQLPlayground({
				endpoint: '/graphql/v1',
				settings: {
					'request.credentials': 'include',
				},
			}),
	  ]
	: [ApolloSession, SetAuthenticatedUser];

logger.info(`example-complex start Graphweaver`);
const graphweaver = new Graphweaver({
	resolvers: [
		HobbyResolver,
		UserResolver,
		SkillResolver,
		DogResolver,
		BreederResolver,
		UserDogResolver,
	],
	mikroOrmOptions: { mikroOrmConfig: { entities: mikroOrmEntities } },
	plugins: pluginsWithPlayground,
	adminMetadata: { enabled: true },
	introspection: process.env.IS_OFFLINE === 'true',
});
logger.info(`example-complex graphweaver.server start`);

exports.handler = graphweaver.server.createHandler({
	expressGetMiddlewareOptions: { bodyParserConfig: { limit: '5mb' } },
});
