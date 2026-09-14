import { join } from 'path';
import { merge } from 'lodash';
import type { InlineConfig } from 'vite';
import type { BuildOptions as ESBuildOptions } from 'esbuild';

export interface BackendOptions {
	additionalFunctions: Array<AdditionalFunctionOptions>;
}

export interface AdditionalFunctionOptions {
	handlerPath: string;
	handlerName?: string;
	urlPath: string;
	cors?: boolean;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
}

export enum PrimaryAuthMethod {
	PASSWORD = 'PASSWORD',
	MAGIC_LINK = 'MAGIC_LINK',
	AUTH_ZERO = 'AUTH_ZERO',
}

export enum SecondaryAuthMethod {
	PASSWORD = 'PASSWORD',
	MAGIC_LINK = 'MAGIC_LINK',
	ONE_TIME_PASSWORD = 'ONE_TIME_PASSWORD',
	WEB3 = 'WEB3',
	PASSKEY = 'PASSKEY',
}

export interface AdminUIAuthOptions {
	primaryMethods?: PrimaryAuthMethod[];
	secondaryMethods?: SecondaryAuthMethod[];
	password?: {
		enableForgottenPassword?: boolean;
		enableResetPassword?: boolean;
	};
}

export interface AdminUIOptions {
	customPagesPath?: string;
	customFieldsPath?: string;
	csvExportOverridesPath?: string;
	auth?: AdminUIAuthOptions;
}

export interface ServerlessOfflineFunctionConfig {
	handler: string;
	environment?: Record<string, string>;
	events: {
		http?: {
			path?: string;
			method?: string;
			cors?: boolean;
		};
	}[];
}

export interface ServerlessOfflineConfig {
	config?: {
		servicePath?: string;
	};
	service: {
		provider: {
			name: string;
			timeout?: number;
			environment?: Record<string, string>;
		};
		custom?: {
			'serverless-offline'?: {
				noPrependStageInUrl?: boolean;
				useInProcess?: boolean;
				host?: string;
				httpPort?: number;
				lambdaPort?: number;
			};
		};
		getAllFunctions: () => string[];
		getFunction: (key: string) => { name: string } & ServerlessOfflineFunctionConfig;
		getAllEventsInFunction: (key: string) => ServerlessOfflineFunctionConfig['events'];
	};
}

export interface StartOptions {
	onResolveEsbuildConfiguration: (
		options: ESBuildOptions
	) => Promise<ESBuildOptions> | ESBuildOptions;
	onResolveViteConfiguration: (options: InlineConfig) => Promise<InlineConfig> | InlineConfig;
	onResolveServerlessOfflineConfiguration: (
		options: ServerlessOfflineConfig
	) => Promise<ServerlessOfflineConfig> | ServerlessOfflineConfig;
}

export interface BuildOptions {
	onResolveEsbuildConfiguration: (
		options: ESBuildOptions
	) => Promise<ESBuildOptions> | ESBuildOptions;
	onResolveViteConfiguration: (options: InlineConfig) => Promise<InlineConfig> | InlineConfig;
}

/**
 * Where the operations for a single trusted document allow list live.
 *
 * The shorthand form is just a list of globs. Use the long form when some of the
 * documents in the list can't be found by a static scan of your source, for
 * example CSV export overrides that build their document at runtime.
 */
export type TrustedDocumentAllowList =
	| string[]
	| {
			/** Globs to scan for `.graphql` / `.gql` files and `gql` tags in `.ts` / `.tsx` / `.js` / `.jsx`. */
			paths: string[];

			/**
			 * Path to a module whose default export is either an array of documents
			 * (`DocumentNode[] | string[]`) or a function returning one. Evaluated at build
			 * time with the built schema and Admin UI metadata, then hashed and validated
			 * alongside the statically extracted documents.
			 */
			additionalDocumentsPath?: string;
	  };

export interface TrustedDocumentOptions {
	/**
	 * Named allow lists of operations. Each list is hashed into the server bundle at build
	 * time; at runtime the `trustedDocuments.allowList` option on your Graphweaver instance
	 * decides which list (or lists) a given request is permitted to use.
	 */
	allowLists: Record<string, TrustedDocumentAllowList>;
}

export interface ImportOptions {
	source?: 'mysql' | 'postgresql' | 'sqlite';
	dbName?: string;
	host?: string;
	port?: number;
	user?: string;
	password?: string;
	overwrite?: boolean;
	clientGeneratedPrimaryKeys?: boolean;
}

export interface ConfigOptions {
	backend: BackendOptions;
	adminUI: AdminUIOptions;
	start: StartOptions;
	build: BuildOptions;
	import: ImportOptions;
	trustedDocuments: TrustedDocumentOptions;
}

export const defaultConfig = (): ConfigOptions => {
	return {
		backend: {
			additionalFunctions: [],
		},
		adminUI: {
			customPagesPath: 'src/admin-ui/custom-pages',
			customFieldsPath: 'src/admin-ui/custom-fields',
			csvExportOverridesPath: 'src/admin-ui/csv-export-overrides',
			auth: {
				password: {
					enableForgottenPassword: true,
					enableResetPassword: true,
				},
			},
		},
		start: {
			onResolveEsbuildConfiguration: (options) => options,
			onResolveViteConfiguration: (options) => options,
			onResolveServerlessOfflineConfiguration: (options) => options,
		},
		build: {
			onResolveEsbuildConfiguration: (options) => options,
			onResolveViteConfiguration: (options) => options,
		},
		import: {},
		trustedDocuments: {
			allowLists: {},
		},
	};
};

export const config = (
	configRoot: string = process.cwd(),
	configFileName = 'graphweaver-config'
): ConfigOptions => {
	try {
		const customConfigPath = join(configRoot, configFileName);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const customConfig = require(customConfigPath);
		if (!customConfig) throw new Error();

		return merge(defaultConfig(), customConfig);
	} catch (error: any) {
		if (
			// It's expected that we'll get a module not found if there is no custom config, but for other
			// errors we'll warn the user about them so they know their custom config isn't getting used.
			error.code !== 'MODULE_NOT_FOUND' ||
			!/Cannot find module '.+graphweaver-config'/.test(error.message)
		) {
			console.warn('Got error while loading custom config: ', error);
			console.warn('Ignoring custom config!');
		}

		return defaultConfig();
	}
};
