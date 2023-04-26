import { BaseResolverInterface, HookManager, HookRegister } from '@exogee/graphweaver';

import { afterCreate, afterUpdate, beforeDelete, beforeRead, beforeUpdate } from '../hooks';

export const AuthorizedBaseResolver = <G>(gqlEntityTypeName: string) => {
	return <T extends { new (): any } & BaseResolverInterface<G>>(constructor: T): T => {
		const hookManager = constructor.prototype.hookManager || new HookManager<G>();

		hookManager.registerHook(HookRegister.BEFORE_READ, beforeRead(gqlEntityTypeName));
		hookManager.registerHook(HookRegister.BEFORE_UPDATE, beforeUpdate(gqlEntityTypeName));
		hookManager.registerHook(HookRegister.BEFORE_DELETE, beforeDelete(gqlEntityTypeName));

		hookManager.registerHook(HookRegister.AFTER_CREATE, afterCreate);
		hookManager.registerHook(HookRegister.AFTER_UPDATE, afterUpdate);

		constructor.prototype.hookManager = hookManager;

		return constructor;
	};
};
