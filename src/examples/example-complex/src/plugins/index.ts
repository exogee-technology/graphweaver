import {
	ClearDatabaseContext,
	ClearDataLoaderCache,
	connectToDatabase,
	DisableApolloServerPluginLandingPage,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
} from '@exogee/graphweaver-apollo';
import type { PluginDefinition } from 'apollo-server-core';

import { ApolloSession } from './apollo-session';
import { Cors } from './cors';
import { SetAuthenticatedUser } from './set-authenticated-user';
import { mikroOrmEntities } from '../entities';

// Order is important here
export const plugins: PluginDefinition[] = [
	MutexRequestsInDevelopment,
	LogRequests,
	LogErrors,
	connectToDatabase({ overrides: { entities: mikroOrmEntities } }),
	ClearDataLoaderCache,
	ClearDatabaseContext,
	ApolloSession,
	SetAuthenticatedUser,
   Cors,
	DisableApolloServerPluginLandingPage,
];
