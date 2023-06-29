import { ApolloServerPlugin } from '@apollo/server';
import { deflate } from 'graphql-deduplicator';

export const dedupeGraphQL: ApolloServerPlugin = {
	async requestDidStart() {
		return {
			async willSendResponse(requestContext) {
				if (requestContext.response.body.kind == 'single') {
					if (requestContext.response.body.singleResult.data) {
						// TODO: check if enabled
						requestContext.response.body.singleResult.data = deflate(
							requestContext.response.body.singleResult.data
						);
						console.log(requestContext.response.body.singleResult.data);

						console.log('deflate', deflate(requestContext.response.body.singleResult.data));
					}
				}
			},
		};
	},
};
