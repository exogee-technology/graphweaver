import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

const connectionIds = new Set<string>();

export const connectToDatabase = (
	options: ConnectionOptions[] | ConnectionOptions
): ApolloServerPlugin => {
	return {
		requestDidStart: async () => {
			return {
				willSendResponse: async () => {
					for (const connectionId of connectionIds) {
						// await ConnectionManager.close(connectionId);
						// connectionIds.delete(connectionId);
					}
				},
			};
		},
		serverWillStart: async () => {
			if (Array.isArray(options)) {
				for (const option of options) {
					if (option.connectionManagerId && !connectionIds.has(option.connectionManagerId)) {
						connectionIds.add(option.connectionManagerId);
						await ConnectionManager.connect(option.connectionManagerId, option);
					}
				}
			} else {
				if (options.connectionManagerId && !connectionIds.has(options.connectionManagerId)) {
					connectionIds.add(options.connectionManagerId);
					await ConnectionManager.connect(options.connectionManagerId, options);
				}
			}
		},
	};
};
