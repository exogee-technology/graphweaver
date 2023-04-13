import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { HookParams, AfterReadHook, BeforeReadHook } from './common/types';

const augmentParamsWithFields = <T>(params: Pick<HookParams<T>, 'info'>) => {
	const parsedInfo = parseResolveInfo(params?.info);
	return {
		...params,
		fields: parsedInfo?.fieldsByTypeName,
	} as HookParams<T>;
};

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

	async runBeforeReadHooks(
		params: Omit<HookParams<T>, 'fields' | 'entities'>
	): Promise<{ filter: Record<string, unknown> }> {
		let filter = {};
		for (const hook of this.beforeReadHooks) {
			const res = await hook(augmentParamsWithFields(params));
			filter = {
				...filter,
				...(res?.filter ? res?.filter : {}),
			};
		}
		return { filter };
	}

	async runAfterReadHooks(params: Omit<HookParams<T>, 'fields'>): Promise<(T | null)[]> {
		let { entities } = params;
		for (const hook of this.afterReadHooks) {
			entities = (await hook(augmentParamsWithFields(params))) || [];
		}
		return entities;
	}
}
