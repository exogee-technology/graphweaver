import { HookFunction, hookManagerMap } from '../hook-manager';
import { HookParams, BaseContext } from '../types';
import { HookManager, HookRegister } from '../hook-manager';

export function Hook<G, P extends HookParams<G, BaseContext>>(
	hookType: HookRegister,
	// You can either decorate a class method, or you can just pass a function here, whatever suits your needs.
	// If you decorate a class method and pass a function as well, the function will be called instead of the class method.
	hook?: HookFunction<G, P>
) {
	return (
		target: any,
		_: string,
		descriptor: TypedPropertyDescriptor<(params: P) => Promise<P>>
	) => {
		const typeName = target.constructor.name;
		const resolvedHook = hook ?? descriptor.value;
		if (typeof resolvedHook !== 'function') {
			throw new Error(
				`@Hook decorator should be applied to a method or you must pass a function to the decorator to use.`
			);
		}

		const hookManager = (hookManagerMap.get(typeName) as HookManager<G>) || new HookManager<G>();
		hookManager.registerHook(hookType, async (params: P) => resolvedHook.call(target, params));
		hookManagerMap.set(typeName, hookManager);
		target.hookManager = hookManager;
	};
}
