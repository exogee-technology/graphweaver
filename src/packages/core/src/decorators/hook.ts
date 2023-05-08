import { BaseContext, hookManagerMap } from '..';
import { HookParams } from '../common/types';
import { HookManager, HookRegister } from '../hook-manager';

export function Hook<G, P extends HookParams<G, BaseContext>>(hookType: HookRegister) {
	return (
		target: any,
		_: string,
		descriptor: TypedPropertyDescriptor<(params: P) => Promise<P>>
	) => {
		const typeName = target.constructor.name;
		const hook = descriptor.value;
		if (typeof hook !== 'function') {
			throw new Error(`@Hook decorator can only be applied to a method.`);
		}

		const hookManager = (hookManagerMap.get(typeName) as HookManager<G>) || new HookManager<G>();
		hookManager.registerHook(hookType, async (params: P) => hook.call(target, params));
		hookManagerMap.set(typeName, hookManager);
		target.hookManager = hookManager;
	};
}
