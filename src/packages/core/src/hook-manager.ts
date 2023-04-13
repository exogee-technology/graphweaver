import { AfterReadHook, BeforeReadHook } from './common/types';

export class HookManager<T> {
	private beforeReadHooks: BeforeReadHook<T>[];
	private afterReadHooks: AfterReadHook<T>[];

	constructor() {
		this.beforeReadHooks = [];
		this.afterReadHooks = [];
	}

	registerBeforeRead(beforeRead: BeforeReadHook<T>) {
		this.beforeReadHooks.push(beforeRead);
	}

	registerAfterRead(afterRead: AfterReadHook<T>) {
		this.afterReadHooks.push(afterRead);
	}
}
