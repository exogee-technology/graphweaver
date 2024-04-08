import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

// This plugin ensures we log errors
export const LogErrors: ApolloServerPlugin = {
	async unexpectedErrorProcessingRequest({ error }) {
		logger.error(error, 'Unexepected error processing request.');
	},

	async requestDidStart() {
		return {
			async didEncounterErrors({ errors }) {
				for (const error of errors) {
					logger.error(error, 'Unexepected error processing request.');
				}
			},
		};
	},
};
