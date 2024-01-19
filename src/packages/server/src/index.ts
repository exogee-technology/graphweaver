import { getAdminUiMetadataResolver } from './metadata-service';
import { AuthChecker, buildSchemaSync } from 'type-graphql';
import { GraphQLSchema } from 'graphql';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';

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
import { EntityMetadataMap } from '@exogee/graphweaver';
import { removeInvalidFilterArg } from './typegraphql-params';

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
	resolvers: Array<any>;
	// We omit schema here because we will build it from your resolvers.
	apolloServerOptions?: Omit<ApolloServerOptionsWithStaticSchema<any>, 'schema'>;
	authChecker?: AuthChecker<any, any>;
	corsOptions?: CorsPluginOptions;
	graphqlDeduplicator?: {
		enabled: boolean;
	};
	enableValidationRules?: boolean;
	fileAutoGenerationOptions?: {
		typesOutputPath?: string[] | string;
	};
}

export default class Graphweaver<TContext extends BaseContext> {
	isStarted = false;
	server: ApolloServer<TContext>;
	public schema: GraphQLSchema;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		resolvers: [],
		apolloServerOptions: {
			introspection: true,
		},
		graphqlDeduplicator: {
			enabled: true,
		},
		enableValidationRules: false,
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

		// Assign default config
		this.config = mergeConfig<GraphweaverConfig>(this.config, config);

		const apolloPlugins = this.config.apolloServerOptions?.plugins || [];

		for (const metadata of EntityMetadataMap.values()) {
			if (metadata.provider.plugins && metadata.provider.plugins.length > 0) {
				// only push unique plugins
				const eMetadataProviderPlugins = metadata.provider.plugins.filter(
					(plugin) => !apolloPlugins.includes(plugin)
				);
				apolloPlugins.push(...eMetadataProviderPlugins);
			}
		}

		const resolvers = (this.config.resolvers || []) as any;

		if (this.config.adminMetadata?.enabled && this.config.resolvers) {
			logger.trace(`Graphweaver adminMetadata is enabled`);
			resolvers.push(getAdminUiMetadataResolver(this.config.adminMetadata?.hooks));
		}
		logger.trace(`Graphweaver buildSchemaSync with ${resolvers.length} resolvers`);

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

		// Remove filter arg from typegraphql metadata for entities whose provider does not support filtering
		removeInvalidFilterArg();

		this.schema = buildSchemaSync({
			resolvers,
			authChecker: config.authChecker ?? (() => true),
			validate: this.config.enableValidationRules,
		});

		logger.trace(`Graphweaver starting ApolloServer`);
		this.server = new ApolloServer<TContext>({
			...(this.config.apolloServerOptions as any),
			plugins,
			schema: this.schema,
		});

		this.isStarted = true;
	}

	public async init() {
		// Do some async here if necessary
		logger.info(`Graphweaver async called`);
	}

	public handler(): AWSLambda.APIGatewayProxyHandler {
		logger.info(`Graphweaver handler called`);

		return this.isStarted
			? startServerAndCreateLambdaHandler(
					// @todo: fix this type, TContext extends BaseContext, this should work
					this.server as unknown as ApolloServer<BaseContext>,
					handlers.createAPIGatewayProxyEventRequestHandler()
			  )
			: ({} as AWSLambda.APIGatewayProxyHandler);
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
