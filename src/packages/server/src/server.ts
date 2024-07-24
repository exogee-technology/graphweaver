import { GraphQLSchema } from 'graphql';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import {
	SchemaBuilder,
	graphweaverMetadata,
	resolveAdminUiMetadata,
	AdminUiMetadata,
	fieldResolver,
	enableFederation,
	buildFederationSchema,
	startTracing,
	isTraceable,
	GraphweaverPlugin,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { ApolloServer, BaseContext } from '@apollo/server';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';

import {
	ClearDataLoaderCache,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
	corsPlugin,
	dedupeGraphQL,
} from './apollo-plugins';
import { StartServerOptions, startStandaloneServer, startServerless } from './integrations';
import { GraphweaverConfig, mergeConfig } from './config';
import { enableTracing } from './trace';
import { pluginManager } from './plugins';

export default class Graphweaver<TContext extends BaseContext> {
	server: ApolloServer<TContext>;
	public schema: GraphQLSchema;
	private graphweaverPlugins: Set<GraphweaverPlugin> = new Set();
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		apolloServerOptions: {
			introspection: process.env.NODE_ENV !== 'production',
		},
		enableFederationTracing: false,
		graphqlDeduplicator: {
			enabled: true,
		},
	};

	constructor(config?: GraphweaverConfig) {
		logger.trace(`Graphweaver constructor called`);

		// Assign default config
		this.config = mergeConfig<GraphweaverConfig>(this.config, config ?? {});

		startTracing({
			instrumentations: this.config.openTelemetry?.instrumentations ?? [],
			traceProvider: this.config.openTelemetry?.traceProvider,
		});

		// Configure the plugins for Graphweaver and Apollo
		this.graphweaverPlugins = pluginManager.getPlugins();
		const apolloPlugins = this.config.apolloServerOptions?.plugins || [];

		for (const metadata of graphweaverMetadata.entities()) {
			if (metadata.provider?.apolloPlugins && metadata.provider.apolloPlugins.length > 0) {
				// only push unique plugins
				const eMetadataProviderPlugins = metadata.provider.apolloPlugins.filter(
					(plugin) => !apolloPlugins.includes(plugin)
				);
				apolloPlugins.push(...eMetadataProviderPlugins);
			}
		}

		if (this.config.adminMetadata?.enabled) {
			logger.trace(`Graphweaver adminMetadata is enabled`);
			graphweaverMetadata.addQuery({
				name: '_graphweaver',
				description: 'Query used by the Admin UI to introspect the schema and metadata.',
				getType: () => AdminUiMetadata,
				resolver: resolveAdminUiMetadata(this.config.adminMetadata?.hooks),
				directives: { inaccessible: true },
			});
		}

		// Order is important here
		const plugins = [
			MutexRequestsInDevelopment,
			LogRequests,
			LogErrors,
			ClearDataLoaderCache,
			corsPlugin(this.config.corsOptions),
			...apolloPlugins,
			...(this.config.graphqlDeduplicator?.enabled ? [dedupeGraphQL] : []),
		];

		logger.trace(graphweaverMetadata.typeCounts, `Graphweaver buildSchemaSync starting.`);

		try {
			if (this.config.federationSubgraphName) {
				enableFederation({
					federationSubgraphName: this.config.federationSubgraphName,
					schemaDirectives: this.config.schemaDirectives,
				});

				// Caution: With this plugin, any client can request a trace for any operation, potentially revealing sensitive server information.
				// It is recommended to ensure that federated subgraphs are not directly exposed to the public Internet. This feature is disabled by default for security reasons.
				if (this.config.enableFederationTracing) plugins.push(ApolloServerPluginInlineTrace());

				this.schema = buildFederationSchema({ schemaDirectives: this.config.schemaDirectives });
			} else {
				this.schema = SchemaBuilder.build({ schemaDirectives: this.config.schemaDirectives });
			}
		} catch (error) {
			logger.error(error, 'Unable to Start Graphweaver: Failed to build schema.');
			throw error;
		}

		// Wrap this in an if statement to avoid doing the work of the printing if trace logging isn't enabled.
		if (logger.isLevelEnabled('trace')) logger.trace(`Schema: ${SchemaBuilder.print()}`);

		logger.trace(`Graphweaver buildSchemaSync finished.`);
		logger.trace(`Graphweaver starting ApolloServer`);
		logger.trace(`Protecting with GraphQL Armor 🛡️`);
		const armor = new ApolloArmor(config?.graphQLArmorOptions);
		const protection = armor.protect();
		this.server = new ApolloServer<TContext>({
			...(this.config.apolloServerOptions as any),
			...protection,
			plugins: [...plugins, ...protection.plugins],
			schema: this.schema,
			fieldResolver,
			includeStacktraceInErrorResponses: process.env.IS_OFFLINE === 'true',
		});

		if (isTraceable()) enableTracing(this.server);
	}

	public handler(): AWSLambda.APIGatewayProxyHandler {
		logger.info(`Graphweaver handler called`);

		return startServerless({
			server: this.server,
			graphweaverPlugins: this.graphweaverPlugins as Set<
				GraphweaverPlugin<AWSLambda.APIGatewayProxyResult>
			>,
		});
	}

	public async start({ host, port, path }: StartServerOptions): Promise<void> {
		logger.info(`Graphweaver start called`);

		await startStandaloneServer(
			{ host, port, path },
			this.server,
			this.graphweaverPlugins as Set<GraphweaverPlugin<void>>
		);
	}
}