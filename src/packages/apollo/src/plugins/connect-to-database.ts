import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '@exogee/graphweaver-mikroorm';

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
