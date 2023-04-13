import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { HookParams, AfterReadHook, BeforeReadHook } from './common/types';

export enum HookRegister {
	BEFORE_READ = 'BEFORE_READ',
	AFTER_READ = 'AFTER_READ',
	BEFORE_UPDATE = 'BEFORE_UPDATE',
	AFTER_UPDATE = 'AFTER_UPDATE',
	BEFORE_DELETE = 'BEFORE_DELETE',
	AFTER_DELETE = 'AFTER_DELETE',
}

const augmentParamsWithFields = <T>(params: Partial<HookParams<T>>) => {
	const parsedInfo = params?.info ? parseResolveInfo(params?.info) : {};
	return {
		...params,
		fields: parsedInfo?.fieldsByTypeName,
	} as HookParams<T>;
};

export class HookManager<T> {
	private hooks: Record<
		HookRegister,
		((params: Partial<HookParams<T>>) => Promise<HookParams<T>>)[]
	> = {
		[HookRegister.BEFORE_READ]: [],
		[HookRegister.AFTER_READ]: [],
		[HookRegister.BEFORE_UPDATE]: [],
		[HookRegister.AFTER_UPDATE]: [],
		[HookRegister.BEFORE_DELETE]: [],
		[HookRegister.AFTER_DELETE]: [],
	};

	registerHook(
		hookType: HookRegister,
		hook: (params: Partial<HookParams<T>>) => Promise<HookParams<T>>
	): void {
		const existingHooks = this.hooks[hookType];
		this.hooks[hookType] = [...existingHooks, hook];
	}

	async runHooks(
		hookType: HookRegister,
		params: Partial<HookParams<T>>
	): Promise<Partial<HookParams<T>>> {
		const hooks = this.hooks[hookType];
		if (!hooks || hooks.length === 0) {
			return params;
		}

		let currentParams = params;
		for (const hook of hooks) {
			currentParams = await hook(augmentParamsWithFields(currentParams));
		}

		return currentParams;
	}
}
