import { AuthorizationContext } from './types';
import { AsyncLocalStorage } from 'async_hooks';
import { logger } from '@exogee/logger';

type AuthContext<T extends AuthorizationContext | undefined> = T;
type Context = {
	authContext: AuthContext<undefined> | AuthContext<AuthorizationContext>;
};

export class RequestContext {
	private static storage = new AsyncLocalStorage<RequestContext>();
	private static counter = 1;

	readonly id = RequestContext.counter++;

	constructor(readonly context: Context) {}

	get authContext() {
		return this.context.authContext;
	}

	static getAuthorizationContext():
		| AuthContext<undefined>
		| AuthContext<AuthorizationContext>
		| undefined {
		const context = RequestContext.currentRequestContext();
		logger.trace(`Getting BaseLoader from RequestContext with id: ${context?.id ?? 'undefined'}`);
		return context ? context.authContext : undefined;
	}

	static async create<T>(next: (...args: any[]) => T): Promise<T> {
		const ctx = RequestContext.createContext();
		logger.trace(`Creating AuthRequestContext with ID: ${ctx.id}`);
		return RequestContext.storage.run(ctx, next);
	}

	static upsertAuthorizationContext(context: AuthorizationContext) {
		const authRequestContext = RequestContext.currentRequestContext();
		if (authRequestContext) {
			if (authRequestContext.context.authContext === undefined)
				authRequestContext.context.authContext = {};
			Object.assign(authRequestContext.context.authContext, context);
		}
	}

	static currentRequestContext(): RequestContext | undefined {
		return RequestContext.storage.getStore();
	}

	private static createContext(): RequestContext {
		const context: Context = {
			authContext: undefined,
		};

		return new RequestContext(context);
	}
}

export function upsertAuthorizationContext(context: AuthorizationContext) {
	RequestContext.upsertAuthorizationContext(context);
}

export function getAuthorizationContext() {
	return RequestContext.getAuthorizationContext();
}

export function getRolesFromAuthorizationContext() {
	const authContext = getAuthorizationContext();

	if (!authContext) {
		throw new Error('Authorization context not set');
	}
	if (
		!authContext.user?.roles ||
		!Array.isArray(authContext.user?.roles) ||
		authContext.user?.roles.length === 0
	) {
		throw new Error('Currently logged in user has no roles');
	}
	return authContext.user.roles;
}
