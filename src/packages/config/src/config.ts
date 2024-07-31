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

export interface AdminUIOptions {
	customPagesPath: string;
	customFieldsPath: string;
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
	onResolveEsbuildConfiguration(options: ESBuildOptions): Promise<ESBuildOptions> | ESBuildOptions;
	onResolveViteConfiguration(options: InlineConfig): Promise<InlineConfig> | InlineConfig;
	onResolveServerlessOfflineConfiguration(
		options: ServerlessOfflineConfig
	): Promise<ServerlessOfflineConfig> | ServerlessOfflineConfig;
}

export interface BuildOptions {
	onResolveEsbuildConfiguration(options: ESBuildOptions): Promise<ESBuildOptions> | ESBuildOptions;
	onResolveViteConfiguration(options: InlineConfig): Promise<InlineConfig> | InlineConfig;
}

export interface ConfigOptions {
	backend: BackendOptions;
	adminUI: AdminUIOptions;
	start: StartOptions;
	build: BuildOptions;
}

export const defaultConfig = (): ConfigOptions => {
	return {
		backend: {
			additionalFunctions: [],
		},
		adminUI: {
			customPagesPath: 'src/admin-ui/custom-pages',
			customFieldsPath: 'src/admin-ui/custom-fields',
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
	};
};

export const config = (
	configRoot: string = process.cwd(),
	configFileName = 'graphweaver-config'
): ConfigOptions => {
	try {
		const customConfigPath = join(configRoot, configFileName);

		// eslint-disable-next-line @typescript-eslint/no-var-requires
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
