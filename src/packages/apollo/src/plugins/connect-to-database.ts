import { Database, ConnectionOptions } from '@exogee/graphweaver-mikroorm';
import { PluginDefinition } from 'apollo-server-core';

export const connectToDatabase = (options: ConnectionOptions): PluginDefinition => {
	return {
		serverWillStart: async () => {
			await Database.connect(options);
		},
	};
};

export const ConnectToDatabase: PluginDefinition = {
	serverWillStart: async () => {
		await Database.connect();
	},
};
