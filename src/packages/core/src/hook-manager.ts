import { ResolveTree, parseResolveInfo } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo, HookParams } from './types';

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

const augmentParamsWithFields = <G, P extends HookParams<G>>(params: P, info: GraphQLResolveInfo) =>
	({
		...params,
		fields: (parseResolveInfo(info) ?? {}) as ResolveTree,
	}) as P;

export type HookFunction<G, P extends HookParams<G> = HookParams<G>> = (params: P) => Promise<P>;

export const hookManagerMap = new Map<string, HookManager<any>>([]);

export class HookManager<G> {
	private hooks: Record<HookRegister, HookFunction<G, any>[]> = {
		[HookRegister.BEFORE_CREATE]: [],
		[HookRegister.AFTER_CREATE]: [],
		[HookRegister.BEFORE_READ]: [],
		[HookRegister.AFTER_READ]: [],
		[HookRegister.BEFORE_UPDATE]: [],
		[HookRegister.AFTER_UPDATE]: [],
		[HookRegister.BEFORE_DELETE]: [],
		[HookRegister.AFTER_DELETE]: [],
	};

	registerHook<P extends HookParams<G>>(hookType: HookRegister, hook: HookFunction<G, P>): void {
		const existingHooks = this.hooks[hookType];
		this.hooks[hookType] = [...existingHooks, hook];
	}

	async runHooks<P extends HookParams<G>>(
		hookType: HookRegister,
		params: P,
		info: GraphQLResolveInfo
	): Promise<P> {
		const hooks = this.hooks[hookType];
		if (!hooks || hooks.length === 0) {
			return params;
		}

		let currentParams = augmentParamsWithFields(params, info);

		for (const hook of hooks) {
			currentParams = await hook(currentParams);
		}

		return currentParams;
	}
}
