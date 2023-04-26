import { BaseResolverInterface, HookManager, HookRegister } from '@exogee/graphweaver';

import { beforeDelete, beforeRead } from '../hooks';

export const AuthorizedBaseResolver = <G>(gqlEntityTypeName: string) => {
	return <T extends { new (): any } & BaseResolverInterface<G>>(constructor: T): T => {
		const hookManager = constructor.prototype.hookManager || new HookManager<G>();

		hookManager.registerHook(HookRegister.BEFORE_READ, beforeRead(gqlEntityTypeName));
		hookManager.registerHook(HookRegister.BEFORE_DELETE, beforeDelete(gqlEntityTypeName));

		constructor.prototype.hookManager = hookManager;

		return constructor;
	};
};
