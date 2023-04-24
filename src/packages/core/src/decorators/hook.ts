import { HookParams } from '../common/types';
import { HookManager, HookRegister } from '../hook-manager';

export function Hook<G, A, P extends HookParams<G, A>>(hookType: HookRegister) {
	return (
		target: any,
		_: string,
		descriptor: TypedPropertyDescriptor<(params: P) => Promise<P>>
	) => {
		const hook = descriptor.value;
		if (typeof hook !== 'function') {
			throw new Error(`@Hook decorator can only be applied to a method.`);
		}

		const hookManager = target.hookManager || new HookManager<G>();
		hookManager.registerHook(hookType, async (params: P) => hook.call(target, params));
		target.hookManager = hookManager;
	};
}
