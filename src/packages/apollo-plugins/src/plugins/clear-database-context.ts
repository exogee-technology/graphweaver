import { Database } from '@exogee/database-entities';
import { PluginDefinition } from 'apollo-server-core';

export const ClearDatabaseContext: PluginDefinition = {
	// We need to ensure the Entity Manager is clear on each request
	async requestDidStart() {
		Database.em.clear();
	},
};
