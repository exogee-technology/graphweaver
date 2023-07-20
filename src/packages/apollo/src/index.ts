import { getAdminUiMetadataResolver } from './metadata-service';
import { AuthChecker, buildSchemaSync, getMetadataStorage } from 'type-graphql';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import pluralize from 'pluralize';

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
import { EntityMetadataMap, TypeMap } from '@exogee/graphweaver';
import { ArgParamMetadata } from 'type-graphql/dist/metadata/definitions';

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
}

export default class Graphweaver<TContext extends BaseContext> {
	server: ApolloServer<TContext>;
	private config: GraphweaverConfig = {
		adminMetadata: { enabled: true },
		resolvers: [],
		apolloServerOptions: {
			introspection: true,
		},
		graphqlDeduplicator: {
			enabled: true,
		},
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

		const eMap = EntityMetadataMap;
		for (const metadata of eMap.values()) {
			if (metadata.provider.plugins && metadata.provider.plugins.length > 0) {
				// only push unique plugins
				const eMetadataProviderPlugins = metadata.provider.plugins.filter(
					(plugin) => !apolloPlugins.includes(plugin)
				);
				apolloPlugins.push(...eMetadataProviderPlugins);
			}
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

		const resolvers = (this.config.resolvers || []) as any;

		if (this.config.adminMetadata?.enabled && this.config.resolvers) {
			logger.trace(`Graphweaver adminMetadata is enabled`);
			resolvers.push(getAdminUiMetadataResolver(this.config.adminMetadata?.hooks));
		}
		logger.trace(`Graphweaver buildSchemaSync with ${resolvers.length} resolvers`);
		/******************************************************* */
		const metadata = getMetadataStorage();
		console.log(metadata);
		console.log(EntityMetadataMap);

		// Type guard for params that are arg kind
		const isArg = (param: any): param is ArgParamMetadata => {
			return param.kind === 'arg';
		};

		// Remove the filter arg from typegraphql metadata
		// All RelationshipField's default to having a filter arg
		// Check to ensure the provider supports filtering
		metadata.params = metadata.params.filter((param) => {
			// Don't touch non-filter params
			if (!isArg(param) || (isArg(param) && param.name !== 'filter')) {
				return true;
			}

			const eMapKey =
				pluralize.singular(param.methodName).charAt(0).toUpperCase() +
				pluralize.singular(param.methodName).slice(1);

			// If this param's methodName is not in the EntityMetadataMap, don't touch it
			if (!EntityMetadataMap.has(pluralize.singular(eMapKey))) {
				return true;
			}
			const entityMetadata = EntityMetadataMap.get(pluralize.singular(eMapKey));
			// If this provider supports filtering, keep the param, otherwise remove it
			if (entityMetadata?.provider?.backendProviderConfig?.filter?.childByChild) {
				return true;
			}

			console.log(param);
			return false;
		});

		// For each of the EntityMetadataMap entries,
		// If the provider supports filtering, add the filter type to the schema
		// for (const entityMetadata of EntityMetadataMap.values()) {
		// 	if (entityMetadata.provider.backendProviderConfig?.filter?.childByChild) {
		// 		console.log('Adding filter type for', entityMetadata);

		// 		// For each of the entityMetadata's fields,
		// 		// look at the field's type and see if it is a relationship field
		// 		for (const fieldMetadata of entityMetadata.fields) {
		// 			const x = EntityMetadataMap.get(fieldMetadata.name);
		// 			const type = fieldMetadata.getType();
		// 			console.log(EntityMetadataMap.get(fieldMetadata.name));
		// 			// if this field supports filtering, add the filter type to the schema
		// 			if (
		// 				EntityMetadataMap.get(fieldMetadata.name)?.provider?.backendProviderConfig?.filter
		// 					?.childByChild
		// 			) {
		// 				console.log('oiiii');
		// 			}
		// 		}

		// 		// key is lowercase entity name
		// 		const key = entityMetadata.entity.name.toLowerCase();

		// 		const getRelatedType = () => {
		// 			return TypeMap[`${pluralize(entityMetadata.entity.name)}ListFilter`];
		// 		};
		// 		const target = entityMetadata.entity.target; // entityMetadata.entity.target.constructor
		// 		// CHECK FEILDS AND LOOK FOR RELATIONSHIPS
		// 		metadata.collectHandlerParamMetadata({
		// 			kind: 'arg',
		// 			target, // class that called this decorator
		// 			// Task entity
		// 			// @RelationshipField<Task>(() => User, { id: 'userId' })
		// 			// task is the target
		// 			// key is this entity
		// 			methodName: pluralize(key),
		// 			index: 3,
		// 			name: 'filter',
		// 			description: 'Filter the related entities',
		// 			deprecationReason: undefined,
		// 			getType: getRelatedType,
		// 			typeOptions: { nullable: true },
		// 			validate: undefined,
		// 		});
		// 	}
		// }
		// ******************************************************* */
		const schema = buildSchemaSync({
			resolvers,
			authChecker: config.authChecker ?? (() => true),
		});

		logger.trace(`Graphweaver starting ApolloServer`);
		this.server = new ApolloServer<TContext>({
			...(this.config.apolloServerOptions as any),
			plugins,
			schema,
		});
	}

	public async init() {
		// Do some async here if necessary
		logger.info(`Graphweaver async called`);
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
