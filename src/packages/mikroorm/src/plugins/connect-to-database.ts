import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

export const connectToDatabase = (options: ConnectionOptions[]): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			for (const option of options) {
				if (option.connectionManagerId)
					await ConnectionManager.connect(option.connectionManagerId, option);
			}
		},
	};
};
