import { PluginDefinition, Config } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-lambda';
import { AdminUiMetadataResolver } from './metadata-service';
import { buildSchemaSync } from 'type-graphql';
import { formatGraphQLError } from './plugins/format-error';
import { ConnectionOptions } from '@exogee/graphweaver-mikroorm';
import {
	ClearDatabaseContext,
	ClearDataLoaderCache,
	connectToDatabase,
	DisableApolloServerPluginLandingPage,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
} from './plugins';
import { Cors } from './plugins/cors';
import { logger } from '@exogee/logger';
export * from './plugins';
export * from 'apollo-server-core';

export interface AdminMetadata {
	enabled: boolean;
	config?: any;
}

export interface GraphweaverConfig extends Config {
	adminMetadata?: AdminMetadata;
	plugins?: PluginDefinition[];
	mikroOrmOptions: ConnectionOptions;
}
export default class Graphweaver {
	server: ApolloServer;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		mikroOrmOptions: { mikroOrmConfig: { entities: [] } },
	};
	constructor(config: GraphweaverConfig) {
		logger.trace(`Graphweaver constructor called`);
		if (!config) {
			throw new Error('Graphweaver config required');
		}
		if (!config.resolvers) {
			throw new Error('Graphweaver config resolvers required');
		}
		this.config = config;
		// Order of plugins is important here
		const plugins: PluginDefinition[] = [
			MutexRequestsInDevelopment,
			LogRequests,
			LogErrors,
			connectToDatabase(this.config.mikroOrmOptions),
			ClearDataLoaderCache,
			ClearDatabaseContext,
			Cors,
			DisableApolloServerPluginLandingPage,
			...(this.config.plugins || []),
		];
		const resolvers = (this.config.resolvers || []) as any;
		if (this.config.adminMetadata?.enabled && this.config.resolvers) {
			logger.trace(`Graphweaver adminMetadata is enabled`);
			resolvers.push(AdminUiMetadataResolver);
		}
		logger.info(`Graphweaver buildSchemaSync with ${resolvers.length} resolvers`);
		const schema = buildSchemaSync({
			resolvers,
			authChecker: () => true,
		});
		logger.info(`Graphweaver starting ApolloServer`);
		this.server = new ApolloServer({
			...this.config,
			plugins,
			schema,
			introspection: process.env.IS_OFFLINE === 'true',
			formatError: this.config.formatError ?? formatGraphQLError,
		});
	}

	public async init() {
		// Do some async here if necessary
		logger.info(`Graphweaver async called`);
	}
}
