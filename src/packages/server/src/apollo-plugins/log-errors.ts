import { ApolloServerPlugin } from '@apollo/server';
import { logger, safeErrorLog } from '@exogee/logger';

// This plugin ensures we log errors
export const LogErrors: ApolloServerPlugin = {
	async unexpectedErrorProcessingRequest({ error }) {
		safeErrorLog(logger, error, 'Unexpected error processing request.');
	},

	async requestDidStart() {
		return {
			async didEncounterErrors({ errors }) {
				for (const error of errors) {
					safeErrorLog(logger, error, 'Unexpected error processing request.');
				}
			},
		};
	},
};
