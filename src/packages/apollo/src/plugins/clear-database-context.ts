import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';

export const ClearDatabaseContext: ApolloServerPlugin = {
	// We need to ensure the Entity Manager is clear on each request
	async requestDidStart() {
		ConnectionManager.default.em.clear();
	},
};
