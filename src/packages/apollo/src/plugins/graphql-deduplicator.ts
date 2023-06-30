import { ApolloServerPlugin } from '@apollo/server';
import { deflate } from 'graphql-deduplicator';

export const dedupeGraphQL: ApolloServerPlugin = {
	async requestDidStart() {
		return {
			async willSendResponse(requestContext) {
				if (requestContext.response.body.kind == 'single') {
					if (requestContext.response.body.singleResult.data) {
						// TODO: check if enabled
						requestContext.response.body.singleResult.data.result = deflate(
							// @ts-ignore
							requestContext.response.body.singleResult.data.result
						);
					}
				}
			},
		};
	},
};
