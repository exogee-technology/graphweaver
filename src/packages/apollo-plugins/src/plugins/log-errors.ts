import { logger } from '@exogee/logger';
import { PluginDefinition } from 'apollo-server-core';

// This plugin ensures we log errors
export const LogErrors: PluginDefinition = {
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
