import dotenv from 'dotenv';
import * as path from 'path';
const envPath = process.env.IS_OFFLINE ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});

import Graphweaver from '@exogee/graphweaver-apollo';
import 'reflect-metadata';

import { setAdministratorRoleName, upsertAuthorizationContext } from '@exogee/graphweaver';

import { plugins } from './plugins';
import { HobbyResolver } from './schema/hobby';
import { UserResolver } from './schema/user';
import { BreederResolver } from './schema/breeder';
import { DogResolver } from './schema/dog';
import { SkillResolver } from './schema/skill';
import { UserDogResolver } from './schema/user-dog';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';

// Setup auth context
setAdministratorRoleName('Administrator');
upsertAuthorizationContext({ roles: ['Administrator'] });

const pluginsWithPlayground =
	process.env.IS_OFFLINE === 'true'
		? [
				...plugins,
				ApolloServerPluginLandingPageGraphQLPlayground({
					endpoint: '/graphql/v1',
					settings: {
						'request.credentials': 'include',
					},
				}),
		  ]
		: plugins;

const graphweaver = new Graphweaver({
	resolvers: [
		HobbyResolver,
		UserResolver,
		SkillResolver,
		DogResolver,
		BreederResolver,
		UserDogResolver,
	],
	plugins: pluginsWithPlayground,
	adminMetadata: { enabled: true },
	introspection: process.env.IS_OFFLINE === 'true',
});

exports.handler = graphweaver.server.createHandler({
	expressGetMiddlewareOptions: { bodyParserConfig: { limit: '5mb' } },
});
