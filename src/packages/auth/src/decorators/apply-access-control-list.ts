import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	HookManager,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AccessControlList, AclMap, AuthorizationContext } from '..';

import { afterCreateOrUpdate, beforeDelete, beforeRead, beforeUpdate } from './hooks/acl';

export function ApplyAccessControlList<G, TContext extends AuthorizationContext>(
	acl: Partial<AccessControlList<G, TContext>>
) {
	return function (constructor: any): void {
		if (AclMap.get(constructor.name)) {
			throw new Error(`An ACL already exists for ${constructor.name}`);
		}
		AclMap.set(constructor.name, acl);

		const hookManager =
			(hookManagerMap.get(constructor.name) as HookManager<G>) || new HookManager<G>();

		hookManager.registerHook<ReadHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_READ,
			beforeRead(constructor.name)
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_UPDATE,
			beforeUpdate(constructor.name)
		);
		hookManager.registerHook<DeleteHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_DELETE,
			beforeDelete(constructor.name)
		);

		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.AFTER_CREATE,
			afterCreateOrUpdate
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.AFTER_UPDATE,
			afterCreateOrUpdate
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
