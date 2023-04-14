import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { HookParams } from './common/types';

export enum HookRegister {
	BEFORE_READ = 'BEFORE_READ',
	AFTER_READ = 'AFTER_READ',
	BEFORE_UPDATE = 'BEFORE_UPDATE',
	AFTER_UPDATE = 'AFTER_UPDATE',
	BEFORE_DELETE = 'BEFORE_DELETE',
	AFTER_DELETE = 'AFTER_DELETE',
}

const augmentParamsWithFields = <G, A>(params: Partial<HookParams<G, A>>) => {
	const parsedInfo = params?.info ? parseResolveInfo(params?.info) : {};
	return {
		...params,
		fields: parsedInfo?.fieldsByTypeName,
	} as HookParams<G, A>;
};

export class HookManager<G> {
	private hooks: Record<
		HookRegister,
		(<A>(params: Partial<HookParams<G, A>>) => Promise<HookParams<G, A>>)[]
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
		hook: <A>(params: Partial<HookParams<G, A>>) => Promise<HookParams<G, A>>
	): void {
		const existingHooks = this.hooks[hookType];
		this.hooks[hookType] = [...existingHooks, hook];
	}

	async runHooks<A>(
		hookType: HookRegister,
		params: Partial<HookParams<G, A>>
	): Promise<Partial<HookParams<G, A>>> {
		const hooks = this.hooks[hookType];
		if (!hooks || hooks.length === 0) {
			return params;
		}

		let currentParams = params;
		for (const hook of hooks) {
			currentParams = await hook<A>(augmentParamsWithFields(currentParams));
		}

		return currentParams;
	}
}
