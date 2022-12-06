import { ApolloServerPlugin } from '@apollo/server';
import { Database } from '@exogee/graphweaver-mikroorm';

export const ClearDatabaseContext: ApolloServerPlugin = {
	// We need to ensure the Entity Manager is clear on each request
	async requestDidStart() {
		Database.em.clear();
	},
};
