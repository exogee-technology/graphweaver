import { ApolloServerPlugin } from '@apollo/server';
import { BaseLoaders, RequestContext } from '@exogee/graphweaver';

export const ClearDataLoaderCache: ApolloServerPlugin = {
	// We need to ensure the Data Loader cache objects are clear on each request
	async requestDidStart() {
		const baseLoader = RequestContext.getBaseLoader() ?? BaseLoaders;
		baseLoader.clearCache();
	},
};
