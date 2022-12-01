import { AdminUiMetadataResolver } from './metadata-service';
import { buildSchemaSync } from 'type-graphql';
import { AuthenticationContext, ConnectionOptions } from '@exogee/graphweaver-mikroorm';
import { formatGraphQLError } from './plugins/format-error';

import { logger } from '@exogee/logger';
import { ApolloServer, ApolloServerOptions, ApolloServerPlugin } from '@apollo/server';
import { ApolloServerOptionsWithStaticSchema } from '@apollo/server/dist/esm/externalTypes/constructor';
import {
	ClearDatabaseContext,
	ClearDataLoaderCache,
	connectToDatabase,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
} from './plugins';
import { Cors } from './plugins/cors';

export * from '@apollo/server';
export { startStandaloneServer } from '@apollo/server/standalone';

export interface AdminMetadata {
	enabled: boolean;
	config?: any;
}

export interface GraphweaverConfig {
	adminMetadata?: AdminMetadata;
	mikroOrmOptions: ConnectionOptions;
	resolvers: Array<any>;
	apolloServerOptions?: ApolloServerOptionsWithStaticSchema<any>;
}
export default class Graphweaver {
	server: ApolloServer;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		mikroOrmOptions: { mikroOrmConfig: { entities: [] } },
		resolvers: [],
	};
	constructor(config: GraphweaverConfig) {
		logger.info(`Graphweaver constructor called`);
		if (!config) {
			throw new Error('Graphweaver config required');
		}
		if (!config.resolvers) {
			throw new Error('Graphweaver resolvers required');
		}
		this.config = config;
		// Order is important here
		const plugins = [
			MutexRequestsInDevelopment,
			LogRequests,
			LogErrors,
			connectToDatabase(this.config.mikroOrmOptions),
			ClearDataLoaderCache,
			ClearDatabaseContext,
			Cors,
			...(this.config.apolloServerOptions?.plugins || []),
		];
		const resolvers = (this.config.resolvers || []) as any;
		if (this.config.adminMetadata?.enabled && this.config.resolvers) {
			logger.info(`Graphweaver adminMetadata is enabled`);
			resolvers.push(AdminUiMetadataResolver);
		}
		logger.info(`Graphweaver buildSchemaSync with ${resolvers.length} resolvers`);
		const schema = buildSchemaSync({
			resolvers,
			authChecker: () => true,
		});
		logger.info(`Graphweaver starting ApolloServer`);
		this.server = new ApolloServer({
			...(this.config.apolloServerOptions as any),
			plugins: plugins,
			schema,
		});
	}

	public async init() {
		// Do some async here if necessary
		logger.info(`Graphweaver async called`);
	}
}
