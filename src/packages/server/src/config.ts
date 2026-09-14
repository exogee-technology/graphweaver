import {
	BaseContext,
	ApolloServerOptionsWithStaticSchema,
	GraphQLRequest,
	HeaderMap,
} from '@apollo/server';
import { GraphQLArmorConfig } from '@escape.tech/graphql-armor-types';
import { BackendProvider, GraphweaverPlugin, Instrumentation } from '@exogee/graphweaver';

import { CorsPluginOptions } from './apollo-plugins';
import type {
	FastifyHttp2Options,
	FastifyHttp2SecureOptions,
	FastifyHttpOptions,
	FastifyHttpsOptions,
} from 'fastify';

export type MetadataHookParams<C> = {
	context: C;
	metadata?: { entities: any; enums: any };
};
export interface AdminMetadata {
	enabled: boolean;
	config?: any;
	/**
	 * @deprecated This argument should not be used and will be removed in the future. Use `applyAccessControlList` instead.
	 */
	hooks?: {
		beforeRead?: <C extends BaseContext>(
			params: MetadataHookParams<C>
		) => Promise<MetadataHookParams<C>>;
		afterRead?: <C extends BaseContext>(
			params: MetadataHookParams<C>
		) => Promise<MetadataHookParams<C>>;
	};
}

/** A single operation baked into the trusted document manifest at build time. */
export interface TrustedDocumentManifestEntry {
	/** The printed, normalised operation, including any fragments it depends on. */
	body: string;
	operationName?: string;
	operationType?: 'query' | 'mutation' | 'subscription';
}

export interface TrustedDocumentManifest {
	format: 'graphweaver-trusted-documents';
	version: 1;

	/** Allow list name -> document id -> the operation that id resolves to. */
	allowLists: Record<string, Record<string, TrustedDocumentManifestEntry>>;
}

/**
 * Which documents a request is permitted to send.
 *
 * - `true` allows any document, skipping enforcement for this request.
 * - `false` rejects the request outright.
 * - A name, or array of names, enforces against those allow lists.
 */
export type TrustedDocumentAllowListValue = boolean | string | string[];

export type TrustedDocumentRequestParams<TContext extends BaseContext> = {
	/** The document id the client sent, if it sent one. */
	documentId?: string;

	/** The operation name the client asked for, if any. */
	operationName?: string | null;

	/**
	 * The request context. Authentication has already been resolved by the time this runs,
	 * so `context.user` and `context.token` are populated if you're using `@exogee/graphweaver-auth`.
	 */
	context: TContext;

	/** The request headers, or an empty map if the request didn't come in over HTTP. */
	headers: HeaderMap;

	request: GraphQLRequest;
};

export type TrustedDocumentAllowListFunction<TContext extends BaseContext> = (
	params: TrustedDocumentRequestParams<TContext>
) => TrustedDocumentAllowListValue | Promise<TrustedDocumentAllowListValue>;

export type TrustedDocumentAllowList<TContext extends BaseContext> =
	| TrustedDocumentAllowListValue
	| TrustedDocumentAllowListFunction<TContext>;

export interface TrustedDocumentOptions<TContext extends BaseContext> {
	/**
	 * Whether to enforce trusted documents. Defaults to `true` when a manifest is supplied.
	 *
	 * While enforcing, clients may only send document ids; a request carrying a raw `query`
	 * is rejected, and Apollo's automatic persisted queries are disabled so that clients
	 * can't register arbitrary operations and replay them by hash.
	 */
	enabled?: boolean;

	/** The manifest generated at build time. Import it from `trusted-documents.generated.ts`. */
	manifest: TrustedDocumentManifest;

	/**
	 * Which allow list(s) a given request may use. Either a static value or a function
	 * (optionally async) returning one. Defaults to the union of every list in the manifest,
	 * which is plain safelisting with no differentiation between clients.
	 */
	allowList?: TrustedDocumentAllowList<TContext>;
}

export interface GraphweaverConfig<TContext extends BaseContext = BaseContext> {
	adminMetadata?: AdminMetadata;
	// We omit schema here because we will build it from your entities + schema extensions.
	apolloServerOptions?: Omit<ApolloServerOptionsWithStaticSchema<any>, 'schema'>;
	fastifyOptions?:
		| FastifyHttp2SecureOptions<any>
		| FastifyHttp2Options<any>
		| FastifyHttpsOptions<any>
		| FastifyHttpOptions<any>;
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
	trustedDocuments?: TrustedDocumentOptions<TContext>;
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
