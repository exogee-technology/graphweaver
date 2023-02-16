import { AdminUiMetadataResolver } from './metadata-service';
import { AuthChecker, buildSchemaSync } from 'type-graphql';
import { ConnectionOptions } from '@exogee/graphweaver-mikroorm';

import { logger } from '@exogee/logger';
import { ApolloServer } from '@apollo/server';
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
	// We omit schema here because we will build it from your resolvers.
	apolloServerOptions?: Omit<ApolloServerOptionsWithStaticSchema<any>, 'schema'>;
	authChecker?: AuthChecker<any, any>;
}
export default class Graphweaver {
	server: ApolloServer;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		mikroOrmOptions: { mikroOrmConfig: { entities: [] } },
		resolvers: [],
	};

	constructor(config: GraphweaverConfig) {
		logger.trace(`Graphweaver constructor called`);
		if (!config) {
			throw new Error('Graphweaver config required');
		}
		if (!config.resolvers) {
			throw new Error('Graphweaver resolvers required');
		}
		if (!config.authChecker) {
			logger.warn(
				'Graphweaver authChecker not set, allowing all access from anywhere. Are you sure you want to do this? This should only happen in a non-real environment.'
			);
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
			logger.trace(`Graphweaver adminMetadata is enabled`);
			resolvers.push(AdminUiMetadataResolver);
		}
		logger.trace(`Graphweaver buildSchemaSync with ${resolvers.length} resolvers`);
		const schema = buildSchemaSync({
			resolvers,
			authChecker: config.authChecker ?? (() => true),
		});

		logger.trace(`Graphweaver starting ApolloServer`);
		this.server = new ApolloServer({
			...(this.config.apolloServerOptions as any),
			plugins,
			schema,
		});
	}

	public async init() {
		// Do some async here if necessary
		logger.info(`Graphweaver async called`);
	}
}
