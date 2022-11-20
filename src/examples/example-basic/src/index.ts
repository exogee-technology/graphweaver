import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { connectToDatabase } from '@exogee/graphweaver-apollo';
import { config } from 'dotenv';
import open from 'open';

import { schema, mikroOrmEntities } from './schema';
config();

const server = new ApolloServer({
	schema,
	plugins: [
		connectToDatabase({ mikroOrmConfig: { entities: mikroOrmEntities } }),
		ApolloServerPluginLandingPageGraphQLPlayground,
	],
	introspection: true,
});

(async () => {
	const info = await server.listen();
	console.log(`GraphWeaver is ready and awaiting at ${info.url}`);
	open(info.url);
})();
