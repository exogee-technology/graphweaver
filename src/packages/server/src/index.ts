import { GraphQLSchema, OperationDefinitionNode, parse } from 'graphql';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import { GraphQLArmorConfig } from '@escape.tech/graphql-armor-types';
import {
	SchemaBuilder,
	graphweaverMetadata,
	resolveAdminUiMetadata,
	AdminUiMetadata,
	fieldResolver,
	enableFederation,
	buildFederationSchema,
	startTracing,
	trace,
	isTraceable,
	Instrumentation,
	BackendProvider,
	setDisableTracingForRequest,
	setEnableTracingForRequest,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { ApolloServer, BaseContext } from '@apollo/server';
import { ApolloServerOptionsWithStaticSchema } from '@apollo/server/dist/esm/externalTypes/constructor';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';

import {
	ClearDataLoaderCache,
	LogErrors,
	LogRequests,
	MutexRequestsInDevelopment,
	corsPlugin,
	dedupeGraphQL,
} from './plugins';

import type { CorsPluginOptions } from './plugins';

export * from '@apollo/server';
export { startStandaloneServer } from '@apollo/server/standalone';

export type MetadataHookParams<C> = {
	context: C;
	metadata?: { entities: any; enums: any };
};
export interface AdminMetadata {
	enabled: boolean;
	config?: any;
	hooks?: {
		beforeRead?: <C extends BaseContext>(
			params: MetadataHookParams<C>
		) => Promise<MetadataHookParams<C>>;
		afterRead?: <C extends BaseContext>(
			params: MetadataHookParams<C>
		) => Promise<MetadataHookParams<C>>;
	};
}

export interface GraphweaverConfig {
	adminMetadata?: AdminMetadata;
	// We omit schema here because we will build it from your entities + schema extensions.
	apolloServerOptions?: Omit<ApolloServerOptionsWithStaticSchema<any>, 'schema'>;
	federationSubgraphName?: string;
	enableFederationTracing?: boolean;
	graphQLArmorOptions?: GraphQLArmorConfig;
	corsOptions?: CorsPluginOptions;
	graphqlDeduplicator?: { enabled: boolean };
	fileAutoGenerationOptions?: {
		typesOutputPath?: string[] | string;
		watchForFileChangesInPaths?: string[];
	};
	schemaDirectives?: Record<string, any>;
	openTelemetry?: {
		traceProvider?: BackendProvider<unknown>;
		instrumentations?: (Instrumentation | Instrumentation[])[];
	};
}

export default class Graphweaver<TContext extends BaseContext> {
	server: ApolloServer<TContext>;
	public schema: GraphQLSchema;
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

		const apolloPlugins = this.config.apolloServerOptions?.plugins || [];

		for (const metadata of graphweaverMetadata.entities()) {
			if (metadata.provider?.plugins && metadata.provider.plugins.length > 0) {
				// only push unique plugins
				const eMetadataProviderPlugins = metadata.provider.plugins.filter(
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

		if (isTraceable()) {
			// Wrap the executeHTTPGraphQLRequest method with a trace span
			// This will allow us to trace the entire request from start to finish
			const executeHTTPGraphQLRequest = this.server.executeHTTPGraphQLRequest;
			this.server.executeHTTPGraphQLRequest = trace((request, trace) => {
				const body = request.httpGraphQLRequest.body as
					| { operationName: string; query: string }
					| undefined;
				const operationName = body?.operationName ?? 'Graphweaver Request';

				const gql = parse(body?.query ?? '');
				const type = (gql.definitions[0] as OperationDefinitionNode)?.operation ?? '';

				trace?.span.updateName(operationName);
				trace?.span.setAttributes({
					'X-Amzn-RequestId': request.httpGraphQLRequest.headers.get('x-amzn-requestid'),
					'X-Amzn-Trace-Id': request.httpGraphQLRequest.headers.get('x-amzn-trace-id'),
					body: JSON.stringify(request.httpGraphQLRequest.body),
					method: request.httpGraphQLRequest.method,
					type,
				});

				const suppressTracing = request.httpGraphQLRequest.headers.get(
					'x-graphweaver-suppress-tracing'
				);

				if (suppressTracing === 'true') {
					return setDisableTracingForRequest(() => {
						return executeHTTPGraphQLRequest.bind(this.server)(request);
					});
				} else {
					return setEnableTracingForRequest(() => {
						return executeHTTPGraphQLRequest.bind(this.server)(request);
					});
				}
			});
		}
	}

	public handler(): AWSLambda.APIGatewayProxyHandler {
		logger.info(`Graphweaver handler called`);

		return startServerAndCreateLambdaHandler(
			// @todo: fix this type, TContext extends BaseContext, this should work
			this.server as unknown as ApolloServer<BaseContext>,
			handlers.createAPIGatewayProxyEventRequestHandler()
		);
	}
}

const mergeConfig = <T>(defaultConfig: T, userConfig: Partial<T>): T => {
	if (typeof defaultConfig !== 'object' || typeof userConfig !== 'object' || !defaultConfig) {
		throw new Error('Invalid config');
	}

	const merged = { ...defaultConfig } as T;

	for (const key in userConfig) {
		const userConfigValue = userConfig[key] as T[Extract<keyof T, string>];
		const defaultConfigValue = defaultConfig?.[key];

		if (Array.isArray(defaultConfigValue) && Array.isArray(userConfigValue)) {
			if (userConfigValue.length > 0) {
				merged[key] = userConfigValue;
			}
		} else if (
			userConfigValue &&
			defaultConfigValue &&
			typeof defaultConfigValue === 'object' &&
			typeof userConfigValue === 'object'
		) {
			if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
				merged[key] = mergeConfig(defaultConfigValue, userConfigValue);
			}
		} else {
			merged[key] = userConfigValue;
		}
	}

	return merged;
};
