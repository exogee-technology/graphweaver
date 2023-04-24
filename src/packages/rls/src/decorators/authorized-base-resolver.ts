import { BaseResolverInterface, HookManager, HookRegister } from '@exogee/graphweaver';

import { beforeRead } from '../hooks';

export const AuthorizedBaseResolver = <G>(gqlEntityTypeName: string) => {
	return <T extends { new (): any } & BaseResolverInterface<G>>(constructor: T): T => {
		const hookManager = constructor.prototype.hookManager || new HookManager<G>();

		constructor.prototype.hookManager.registerHook(
			HookRegister.BEFORE_READ,
			beforeRead(gqlEntityTypeName)
		);
		constructor.prototype.hookManager = hookManager;

		return constructor;
	};
};
