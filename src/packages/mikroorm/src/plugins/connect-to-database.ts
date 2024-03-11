import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

const connectionIds = new Set<string>();

export const connectToDatabase = (
	options: ConnectionOptions[] | ConnectionOptions
): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			const connections = Array.isArray(options) ? options : [options];
			for (const option of connections) {
				if (option.connectionManagerId && !connectionIds.has(option.connectionManagerId)) {
					connectionIds.add(option.connectionManagerId);
					await ConnectionManager.connect(option.connectionManagerId, option);
				}
			}
		},
	};
};
