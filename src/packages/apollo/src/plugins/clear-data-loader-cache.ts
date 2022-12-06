import { ApolloServerPlugin } from '@apollo/server';
import { BaseLoaders } from '@exogee/graphweaver';

export const ClearDataLoaderCache: ApolloServerPlugin = {
	// We need to ensure the Data Loader cache objects are clear on each request
	async requestDidStart() {
		BaseLoaders.clearCache();
	},
};
