import { AsyncLocalStorage } from 'node:async_hooks';
import { logger } from '@exogee/logger';
import { Mutex } from 'async-mutex';

import { BaseLoader } from './base-loader';

type Context = {
	BaseLoaders: BaseLoader;
};

export class RequestContext {
	private static storage = new AsyncLocalStorage<RequestContext>();
	private static counter = 1;

	// Workaround for environments that don't support AsyncLocalStorage
	private static workaroundStorage: RequestContext | undefined;
	private static mutex = new Mutex();

	readonly id = RequestContext.counter++;

	constructor(readonly context: Context) {}

	get BaseLoader(): BaseLoader {
		return this.context.BaseLoaders;
	}

	static getBaseLoader(): BaseLoader | undefined {
		const context = RequestContext.currentRequestContext();
		logger.trace(`Getting BaseLoader from RequestContext with id: ${context?.id ?? 'undefined'}`);
		return context ? context.BaseLoader : undefined;
	}

	static async create<T>(next: (...args: any[]) => T): Promise<T> {
		const ctx = RequestContext.createContext();
		logger.trace(`Creating RequestContext with ID: ${ctx.id}`);

		// WebContainers don't support AsyncLocalStorage:
		// https://github.com/stackblitz/webcontainer-core/issues/1169
		//
		// To support use cases like this, if you want us to, we'll just use a singleton
		// scratch pad that we mutex access to, which will enforce that only one request
		// can happen at a time, but will not rely on the AsyncLocalStorage API.
		//
		// In standard Node this is not an issue, but if you need to turn off support for
		// isolated async contexts, you can do so with this environment variable.
		if (process.env.GRAPHWEAVER_DISABLE_ASYNC_LOCAL_STORAGE === 'true') {
			logger.trace('AsyncLocalStorage is disabled, using workaround storage, creating context.');
			this.workaroundStorage = ctx;
			return await this.mutex.runExclusive(next);
		} else {
			logger.trace('Creating new AsyncLocalStorage context.');
			return RequestContext.storage.run(ctx, next);
		}
	}

	static currentRequestContext(): RequestContext | undefined {
		if (process.env.GRAPHWEAVER_DISABLE_ASYNC_LOCAL_STORAGE === 'true') {
			return this.workaroundStorage;
		} else {
			return RequestContext.storage.getStore();
		}
	}

	private static createContext(): RequestContext {
		const context: Context = {
			BaseLoaders: new BaseLoader(),
		};

		return new RequestContext(context);
	}
}
