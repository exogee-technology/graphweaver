import {
	ClearDatabaseContext,
	ClearDataLoaderCache,
	ConnectToDatabase,
	DisableApolloServerPluginLandingPage,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
} from '@exogee/apollo-plugins';
import type { PluginDefinition } from 'apollo-server-core';

import { ApolloSession } from './apollo-session';
import { Cors } from './cors';
import { SetAuthenticatedUser } from './set-authenticated-user';

// Order is important here
export const plugins: PluginDefinition[] = [
	MutexRequestsInDevelopment,
	LogRequests,
	LogErrors,
	ConnectToDatabase,
	ClearDataLoaderCache,
	ClearDatabaseContext,
	ApolloSession,
	SetAuthenticatedUser,
	Cors,
	DisableApolloServerPluginLandingPage,
];
