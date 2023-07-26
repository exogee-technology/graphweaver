import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

export const connectToDatabase = (
	options: ConnectionOptions[] | ConnectionOptions
): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			if (Array.isArray(options)) {
				for (const option of options) {
					if (option.connectionManagerId)
						await ConnectionManager.connect(option.connectionManagerId, option);
				}
			} else {
				if (options.connectionManagerId) {
					await ConnectionManager.connect(options.connectionManagerId, options);
				}
			}
		},
	};
};
