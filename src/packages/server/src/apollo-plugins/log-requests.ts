import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { stripIgnoredCharacters } from 'graphql';

// This plugin logs on each request.
export const LogRequests: ApolloServerPlugin = {
	async requestDidStart({ request: { variables, query } }) {
		const variablesCopy = { ...variables };

		logger.info(
			{
				query: query ? stripIgnoredCharacters(query) : query,
				variables: JSON.stringify(variablesCopy),
			},
			'Query received'
		);

		let operation: string | null;
		return {
			async didResolveOperation({ operationName }) {
				operation = operationName;
			},

			async willSendResponse({ response }) {
				logger.info(
					{ operation },
					`Sending ${JSON.stringify(response).length * 2} bytes in response.`
				);
			},
		};
	},
};
