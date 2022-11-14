import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ConnectToDatabase } from '@exogee/apollo-plugins';
import { config } from 'dotenv';
import open from 'open';

import { schema } from './schema';

config();

const server = new ApolloServer({
	schema,
	plugins: [ConnectToDatabase, ApolloServerPluginLandingPageGraphQLPlayground],
	introspection: true,
});

(async () => {
	const info = await server.listen();
	console.log(`GraphWeaver is ready and awaiting at ${info.url}`);
	open(info.url);
})();
