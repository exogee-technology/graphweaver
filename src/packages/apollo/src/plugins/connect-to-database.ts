import { ApolloServerPlugin } from '@apollo/server';
import { Database, ConnectionOptions } from '@exogee/graphweaver-mikroorm';

export const connectToDatabase = (options: ConnectionOptions): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			await Database.connect(options);
		},
	};
};

export const ConnectToDatabase: ApolloServerPlugin = {
	serverWillStart: async () => {
		await Database.connect();
	},
};
