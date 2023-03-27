import { ApolloServerPlugin } from '@apollo/server';
import { Database, cm, ConnectionOptions } from '@exogee/graphweaver-mikroorm';

export const connectToDatabase = (options: ConnectionOptions[]): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			await Database.connect(options?.[0]);
			for (const option of options) {
				if (option.connectionManagerId) await cm.connect(option.connectionManagerId, option);
			}
		},
	};
};

export const ConnectToDatabase: ApolloServerPlugin = {
	serverWillStart: async () => {
		await Database.connect();
	},
};
