import { AsyncLocalStorage } from 'async_hooks';
import { BaseLoader } from './base-loader';
import { logger } from '@exogee/logger';

type Context = {
	BaseLoaders: BaseLoader;
};

export class RequestContext {
	private static storage = new AsyncLocalStorage<RequestContext>();
	private static counter = 1;

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
		const ctx = this.createContext();
		logger.trace(`Creating RequestContext with ID: ${ctx.id}`);
		return this.storage.run(ctx, next);
	}

	static currentRequestContext(): RequestContext | undefined {
		return this.storage.getStore();
	}

	private static createContext(): RequestContext {
		const context: Context = {
			BaseLoaders: new BaseLoader(),
		};

		return new RequestContext(context);
	}
}
