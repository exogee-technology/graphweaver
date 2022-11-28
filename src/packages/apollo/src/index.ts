import { PluginDefinition, Config } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-lambda';
import { AdminUiMetadataResolver } from './metadata-service';
import { buildSchemaSync } from 'type-graphql';
import { formatGraphQLError } from './plugins/format-error';
export * from './plugins';

export interface AdminMetadata {
	enabled: boolean;
	config?: any;
}
export interface GraphweaverConfig extends Config {
	adminMetadata?: AdminMetadata;
	plugins?: PluginDefinition[];
}
export default class Graphweaver {
	server: ApolloServer;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
	};
	constructor(config: GraphweaverConfig) {
		if (!config) {
			throw new Error('Graphweaver config required');
		}
		if (!config.resolvers) {
			throw new Error('Graphweaver config resolvers required');
		}
		this.config = config;
		const resolvers = (this.config.resolvers || []) as any;
		if (this.config.adminMetadata?.enabled && this.config.resolvers) {
			resolvers.push(AdminUiMetadataResolver);
		}
		const schema = buildSchemaSync({
			resolvers,
			authChecker: () => true,
		});
		this.server = new ApolloServer({
			...this.config,
			schema,
			introspection: process.env.IS_OFFLINE === 'true',
			formatError: this.config.formatError ?? formatGraphQLError,
		});
	}
}
