import { ApolloServerPlugin } from '@apollo/server';
import { deflate } from 'graphql-deduplicator';

export const dedupeGraphQL: ApolloServerPlugin = {
	async requestDidStart() {
		return {
			async willSendResponse(requestContext) {
				if (
					requestContext.response.body.kind == 'single' &&
					requestContext.response.body.singleResult.data
				) {
					if (typeof requestContext.response.body.singleResult.data.result === 'object') {
						requestContext.response.body.singleResult.data.result = deflate(
							requestContext.response.body.singleResult.data.result as object
						);
					}
				}
			},
		};
	},
};
