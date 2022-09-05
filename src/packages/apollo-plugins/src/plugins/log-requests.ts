import { logger } from '@exogee/logger';
import { PluginDefinition } from 'apollo-server-core';
import { stripIgnoredCharacters } from 'graphql';

// This plugin logs on each request.
export const LogRequests: PluginDefinition = {
	async requestDidStart({ request: { variables, query } }) {
		const variablesCopy = { ...variables };

		logger.info('Query received', {
			query: query ? stripIgnoredCharacters(query) : query,
			variables: JSON.stringify(variablesCopy),
		});
	},
};
