import { ApolloServerPlugin } from '@apollo/server';
import { ConnectionManager, ConnectionOptions } from '../database';

export const connectToDatabase = (
	options: ConnectionOptions[] | ConnectionOptions
): ApolloServerPlugin => {
	return {
		serverWillStart: async () => {
			const connectionOptionsMap = new Map<string, ConnectionOptions>();

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
// 					if (option.connectionManagerId && !connections.includes(option.connectionManagerId))
// 						await ConnectionManager.connect(option.connectionManagerId, option);
// 				}
// 			} else {
// 				if (options.connectionManagerId && !connections.includes(options.connectionManagerId)) {
// 					await ConnectionManager.connect(options.connectionManagerId, options);
// 				}
// 			}
// 		},
// 	};
// };
