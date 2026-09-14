import { existsSync } from 'fs';
import { Module } from 'module';
import { dirname, join } from 'path';
import { buildSync } from 'esbuild';
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
	AUTH_ZERO = 'AUTH_ZERO',
	MAGIC_LINK = 'MAGIC_LINK',
	MICROSOFT_ENTRA = 'MICROSOFT_ENTRA',
	OKTA = 'OKTA',
	PASSWORD = 'PASSWORD',
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

/**
 * SSL options for the database connection the import uses.
 *
 * Certificates and keys can be given either as a path to a file on disk or as the PEM encoded
 * contents of the certificate itself, whichever is more convenient.
 */
export interface ImportSslOptions {
	/** The certificate authority (or authorities) to trust when connecting. */
	ca?: string | string[];

	/** The client certificate to present to the server, if it requires one. */
	cert?: string;

	/** The private key for the client certificate above. */
	key?: string;

	/** The passphrase for the private key above, if it is encrypted. */
	passphrase?: string;

	/** Defaults to true. Set to false to accept certificates the CAs above don't vouch for. */
	rejectUnauthorized?: boolean;
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

	/**
	 * How to secure the connection to the database. `true` connects with SSL using the system
	 * certificate authorities, or pass an object to supply your own certificates. Whatever you
	 * set here is also written into the `database.ts` the import generates.
	 */
	ssl?: boolean | ImportSslOptions;
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

/**
 * The shape of a `graphweaver-config` file. Everything is optional; anything you leave out comes
 * from `defaultConfig()` instead.
 */
export interface GraphweaverConfig {
	backend?: Partial<BackendOptions>;
	adminUI?: AdminUIOptions;
	start?: Partial<StartOptions>;
	build?: Partial<BuildOptions>;
	import?: ImportOptions;
	trustedDocuments?: TrustedDocumentOptions;
}

/**
 * Identity function that gives you type checking and autocomplete inside a
 * `graphweaver-config.ts`:
 *
 * ```ts
 * import { defineConfig } from '@exogee/graphweaver-config';
 *
 * export default defineConfig({
 * 	trustedDocuments: { allowLists: { web: ['src/frontend/**\/*.graphql'] } },
 * });
 * ```
 */
export const defineConfig = (config: GraphweaverConfig): GraphweaverConfig => config;

// esbuild understands all three, so which one you reach for is up to your project's module setup.
const TYPESCRIPT_EXTENSIONS = ['.ts', '.mts', '.cts'];

// `config()` is called several times per command and each call would otherwise pay for another
// transpile, so hold onto whatever we loaded the first time. The JavaScript path gets the same
// treatment for free from `require()`'s own module cache.
const typeScriptConfigCache = new Map<string, unknown>();

const findTypeScriptConfig = (configRoot: string, configFileName: string) => {
	for (const extension of TYPESCRIPT_EXTENSIONS) {
		const candidate = join(configRoot, `${configFileName}${extension}`);
		if (existsSync(candidate)) return candidate;
	}
};

const loadTypeScriptConfig = (configPath: string) => {
	if (typeScriptConfigCache.has(configPath)) return typeScriptConfigCache.get(configPath);

	const { outputFiles } = buildSync({
		entryPoints: [configPath],
		bundle: true,
		write: false,
		platform: 'node',
		format: 'cjs',
		target: `node${process.versions.node.split('.')[0]}`,

		// Bundling is only here so the config can import helpers from elsewhere in the project.
		// Anything that comes from node_modules stays a plain require, so it resolves against the
		// user's install at run time instead of being inlined into what we evaluate.
		packages: 'external',

		// We report failures ourselves below, so don't let esbuild print them as well.
		logLevel: 'silent',
	});

	// Evaluate the result as a CommonJS module living where the original file lives, so relative
	// requires and node_modules lookups both behave the way the author would expect.
	const configModule = new Module(configPath);
	configModule.filename = configPath;
	configModule.paths = (Module as any)._nodeModulePaths(dirname(configPath));
	(configModule as any)._compile(outputFiles[0].text, configPath);

	const exports = configModule.exports;

	// `export default { ... }` lands on `.default`, while named exports and `module.exports = ...`
	// are the namespace itself.
	const customConfig =
		exports?.__esModule && 'default' in exports ? exports.default : (exports as unknown);

	typeScriptConfigCache.set(configPath, customConfig);

	return customConfig;
};

export const config = (
	configRoot: string = process.cwd(),
	configFileName = 'graphweaver-config'
): ConfigOptions => {
	try {
		const typeScriptConfigPath = findTypeScriptConfig(configRoot, configFileName);

		const customConfig = typeScriptConfigPath
			? loadTypeScriptConfig(typeScriptConfigPath)
			: // eslint-disable-next-line @typescript-eslint/no-require-imports
				require(join(configRoot, configFileName));

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
