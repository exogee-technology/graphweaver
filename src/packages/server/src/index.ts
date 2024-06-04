import { GraphQLSchema } from 'graphql';
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
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { ApolloServer, BaseContext } from '@apollo/server';
import { ApolloServerOptionsWithStaticSchema } from '@apollo/server/dist/esm/externalTypes/constructor';

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
	enableFederation?: boolean;
	graphQLArmorOptions?: GraphQLArmorConfig;
	corsOptions?: CorsPluginOptions;
	graphqlDeduplicator?: { enabled: boolean };
	fileAutoGenerationOptions?: {
		typesOutputPath?: string[] | string;
		watchForFileChangesInPaths?: string[];
	};
}

export default class Graphweaver<TContext extends BaseContext> {
	server: ApolloServer<TContext>;
	public schema: GraphQLSchema;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		apolloServerOptions: {
			introspection: true,
		},
		enableFederation: false,
		graphqlDeduplicator: {
			enabled: true,
		},
	};

	constructor(config?: GraphweaverConfig) {
		logger.trace(`Graphweaver constructor called`);

		// Assign default config
		this.config = mergeConfig<GraphweaverConfig>(this.config, config ?? {});

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
			if (this.config.enableFederation) enableFederation();
			this.schema = SchemaBuilder.build();
		} catch (error) {
			logger.error(error, 'Unable to Start Graphweaver: Failed to build schema.');
			throw error;
		}

		// Wrap this in an if statement to avoid doing the work of the printing if trace logging isn't enabled.
		if (logger.isLevelEnabled('trace')) logger.trace('Schema: ', SchemaBuilder.print());

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
