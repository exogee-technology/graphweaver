import { HookFunction, hookManagerMap } from '../hook-manager';
import { HookParams, BaseContext } from '../types';
import { HookManager, HookRegister } from '../hook-manager';

export function Hook<G, P extends HookParams<G, BaseContext>>(
	hookType: HookRegister,
	// You can either decorate a class method, or you can just pass a function here, whatever suits your needs.
	// If you decorate a class method and pass a function as well, an error will be thrown.
	hook?: HookFunction<G, P>
) {
	return (
		target: any,
		propertyKey?: string,
		descriptor?: TypedPropertyDescriptor<(params: P) => Promise<P>>
	) => {
		if (hook && descriptor?.value) {
			throw new Error(
				`@Hook decorator should can be applied to a method or a class. If you apply to a method you cannot pass in a hook function. Use two @Hook decorators to accomplish this.`
			);
		}
		if (descriptor?.value && typeof descriptor.value !== 'function') {
			throw new Error(
				`@Hook decorator should be applied to a method or you must pass a function to the decorator to use.`
			);
		}

		// For instance methods, target is the prototype so we need target.constructor.name.
		// For everything else (static methods, class decorators), target is the class itself.
		const isInstanceMethod = descriptor?.value && typeof target !== 'function';
		const typeName = isInstanceMethod ? target.constructor.name : target.name;
		const hookManager = (hookManagerMap.get(typeName) as HookManager<G>) || new HookManager<G>();

		if (descriptor?.value) {
			hookManager.registerHook(hookType, (async (params: P) =>
				descriptor.value?.call(target, params)) as HookFunction<G, P>);
		} else if (hook) {
			hookManager.registerHook(hookType, hook);
		} else {
			throw new Error(
				`@Hook decorator should be applied to a method or you must pass a function to the decorator to use.`
			);
		}

		hookManagerMap.set(typeName, hookManager);
		(target as any).hookManager = hookManager;
	};
}
