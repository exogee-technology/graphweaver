import { ApolloServerOptionsWithStaticSchema } from '@apollo/server';
import { AdminMetadata } from './types';
import { GraphQLArmorConfig } from '@escape.tech/graphql-armor-types';
import { CorsPluginOptions } from './apollo-plugins';
import { BackendProvider, GraphweaverPlugin, Instrumentation } from '@exogee/graphweaver';

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
	plugins?: GraphweaverPlugin[];
	schemaDirectives?: Record<string, any>;
	openTelemetry?: {
		traceProvider?: BackendProvider<unknown>;
		instrumentations?: (Instrumentation | Instrumentation[])[];
	};
}

export const mergeConfig = <T>(defaultConfig: T, userConfig: Partial<T>): T => {
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
