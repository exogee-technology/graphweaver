import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { ConnectionManager } from '../database';

export const ClearDatabaseContext: ApolloServerPlugin = {
	// We need to ensure the Entity Manager is clear on each request
	async requestDidStart() {
		try {
			for (const connection of ConnectionManager.getConnections()) {
				connection.em.clear();
			}
		} catch (err) {
			logger.trace('failed to clear default database.');
		}
	},
};
