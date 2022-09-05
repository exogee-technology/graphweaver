import { BaseLoaders } from '@exogee/base-resolver';
import { PluginDefinition } from 'apollo-server-core';

export const ClearDataLoaderCache: PluginDefinition = {
	// We need to ensure the Data Loader cache objects are clear on each request
	async requestDidStart() {
		BaseLoaders.clearCache();
	},
};
