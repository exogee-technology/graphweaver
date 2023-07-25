import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

// This plugin ensures we log errors
export const LogErrors: ApolloServerPlugin = {
	async requestDidStart() {
		return {
			didEncounterErrors: async ({ errors }) => {
				for (const error of errors) {
					logger.error(error);
				}
			},
		};
	},
};
