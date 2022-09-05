import { Database } from '@exogee/database-entities';
import { PluginDefinition } from 'apollo-server-core';

export const ConnectToDatabase: PluginDefinition = {
	serverWillStart: async () => {
		await Database.connect();
	},
};
