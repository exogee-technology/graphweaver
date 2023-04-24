import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { HookParams } from './common/types';

export enum HookRegister {
	BEFORE_CREATE = 'BEFORE_CREATE',
	AFTER_CREATE = 'AFTER_CREATE',
	BEFORE_READ = 'BEFORE_READ',
	AFTER_READ = 'AFTER_READ',
	BEFORE_UPDATE = 'BEFORE_UPDATE',
	AFTER_UPDATE = 'AFTER_UPDATE',
	BEFORE_DELETE = 'BEFORE_DELETE',
	AFTER_DELETE = 'AFTER_DELETE',
}

const augmentParamsWithFields = <G, P extends HookParams<G>>(params: P) => {
	const parsedInfo = params?.info ? parseResolveInfo(params?.info) : {};
	return {
		...params,
		fields: parsedInfo?.fieldsByTypeName,
	} as P;
};

export type HookFunction = <G, P extends HookParams<G>>(params: P) => Promise<P>;

export class HookManager<G> {
	private hooks: Record<HookRegister, HookFunction[]> = {
		[HookRegister.BEFORE_CREATE]: [],
		[HookRegister.AFTER_CREATE]: [],
		[HookRegister.BEFORE_READ]: [],
		[HookRegister.AFTER_READ]: [],
		[HookRegister.BEFORE_UPDATE]: [],
		[HookRegister.AFTER_UPDATE]: [],
		[HookRegister.BEFORE_DELETE]: [],
		[HookRegister.AFTER_DELETE]: [],
	};

	registerHook(hookType: HookRegister, hook: HookFunction): void {
		const existingHooks = this.hooks[hookType];
		this.hooks[hookType] = [...existingHooks, hook];
	}

	async runHooks<P extends HookParams<G>>(hookType: HookRegister, params: P): Promise<P> {
		const hooks = this.hooks[hookType];
		if (!hooks || hooks.length === 0) {
			return params;
		}

		let currentParams = params;
		for (const hook of hooks) {
			currentParams = await hook<G, P>(augmentParamsWithFields(currentParams));
		}

		return currentParams;
	}
}
