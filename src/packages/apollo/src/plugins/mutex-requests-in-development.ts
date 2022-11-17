import { logger } from '@exogee/logger';
import { PluginDefinition } from 'apollo-server-core';
import { Mutex, MutexInterface } from 'async-mutex';

const mutex = new Mutex();
let release: MutexInterface.Releaser | undefined;

export const MutexRequestsInDevelopment: PluginDefinition = {
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
