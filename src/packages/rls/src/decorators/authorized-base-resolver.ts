import { BaseResolverInterface, HookManager, HookRegister } from '@exogee/graphweaver';

import { afterCreateOrUpdate, beforeDelete, beforeRead, beforeUpdate } from '../hooks';

export const AuthorizedBaseResolver = <G>(gqlEntityTypeName: string) => {
	return <T extends { new (): any } & BaseResolverInterface<G>>(constructor: T): T => {
		const hookManager = constructor.prototype.hookManager || new HookManager<G>();

		hookManager.registerHook(HookRegister.BEFORE_READ, beforeRead(gqlEntityTypeName));
		hookManager.registerHook(HookRegister.BEFORE_UPDATE, beforeUpdate(gqlEntityTypeName));
		hookManager.registerHook(HookRegister.BEFORE_DELETE, beforeDelete(gqlEntityTypeName));

		hookManager.registerHook(HookRegister.AFTER_CREATE, afterCreateOrUpdate);
		hookManager.registerHook(HookRegister.AFTER_UPDATE, afterCreateOrUpdate);

		constructor.prototype.hookManager = hookManager;

		return constructor;
	};
};
