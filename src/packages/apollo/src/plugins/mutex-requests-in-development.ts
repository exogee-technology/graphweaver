import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { Mutex, MutexInterface } from 'async-mutex';

const mutex = new Mutex();
let release: MutexInterface.Releaser | undefined;

export const MutexRequestsInDevelopment: ApolloServerPlugin = {
	async requestDidStart() {
		if (process.env.IS_OFFLINE) {
			logger.warn('Mutexing requests. This should only be required in dev!');

			return {
				responseForOperation: async () => {
					release = await mutex.acquire();
					return null;
				},

				willSendResponse: async () => {
					release?.();
					release = undefined;
				},
			};
		}
	},
};
