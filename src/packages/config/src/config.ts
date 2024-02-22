import { join } from 'path';
import { merge } from 'lodash';

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

export interface StartOptions {
	onResolveEsbuildConfiguration(options: any): Promise<any> | any;
	onResolveViteConfiguration(options: any): Promise<any> | any;
	onResolveServerlessOfflineConfiguration(options: any): Promise<any> | any;
}

export interface BuildOptions {
	onResolveEsbuildConfiguration(options: any): Promise<any> | any;
	onResolveViteConfiguration(options: any): Promise<any> | any;
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
	} catch {
		return defaultConfig();
	}
};
