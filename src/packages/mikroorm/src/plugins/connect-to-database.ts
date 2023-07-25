import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

const connectionOptionsMap = new Map<string, ConnectionOptions>();

export const connectToDatabase = (
	options: ConnectionOptions[] | ConnectionOptions
): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			if (Array.isArray(options)) {
				for (const option of options) {
					if (option.connectionManagerId && !connectionOptionsMap.has(option.connectionManagerId))
						connectionOptionsMap.set(option.connectionManagerId, option);
					await ConnectionManager.connect(option.connectionManagerId, option);
				}
			} else {
				if (options.connectionManagerId && !connectionOptionsMap.has(options.connectionManagerId)) {
					connectionOptionsMap.set(options.connectionManagerId, options);
					await ConnectionManager.connect(options.connectionManagerId, options);
				}
			}
		},
	};
};

// export const connectToDatabase = (
// 	options: ConnectionOptions[] | ConnectionOptions
// ): ApolloServerPlugin => {
// 	return {
// 		serverWillStart: async () => {
// 			const connections = ConnectionManager.getConnectionIds();

// 			if (Array.isArray(options)) {
// 				for (const option of options) {
// 					if (option.connectionManagerId && !connections.has(option.connectionManagerId))
// 						await ConnectionManager.connect(option.connectionManagerId, option);
// 				}
// 			} else {
// 				if (options.connectionManagerId && !connections.has(options.connectionManagerId)) {
// 					await ConnectionManager.connect(options.connectionManagerId, options);
// 				}
// 			}
// 		},
// 	};
// };
