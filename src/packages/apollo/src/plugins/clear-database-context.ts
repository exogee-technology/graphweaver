import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { logger } from '@exogee/logger';

export const ClearDatabaseContext: ApolloServerPlugin = {
	// We need to ensure the Entity Manager is clear on each request
	async requestDidStart() {
		try {
			ConnectionManager.default.em.clear();
		} catch (err) {
			logger.trace('failed to clear default database.');
		}
	},
};
