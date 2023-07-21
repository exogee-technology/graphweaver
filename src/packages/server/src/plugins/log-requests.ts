import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { stripIgnoredCharacters } from 'graphql';

// This plugin logs on each request.
export const LogRequests: ApolloServerPlugin = {
	async requestDidStart({ request: { variables, query } }) {
		const variablesCopy = { ...variables };

		logger.info('Query received', {
			query: query ? stripIgnoredCharacters(query) : query,
			variables: JSON.stringify(variablesCopy),
		});
	},
};
