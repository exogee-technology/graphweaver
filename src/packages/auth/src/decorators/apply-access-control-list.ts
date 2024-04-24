import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	HookManager,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AccessControlList, AccessType, AclMap, AuthorizationContext } from '..';

import { afterCreateOrUpdate, beforeDelete, beforeRead, beforeCreateOrUpdate } from './hooks/acl';

export const registerAccessControlListHook = <G, TContext extends AuthorizationContext>(
	entityName: string,
	acl: Partial<AccessControlList<G, TContext>>
) => {
	if (AclMap.get(entityName)) {
		throw new Error(`An ACL already exists for ${entityName}`);
	}
	AclMap.set(entityName, acl);

	const hookManager = (hookManagerMap.get(entityName) as HookManager<G>) || new HookManager<G>();

	hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
		HookRegister.BEFORE_CREATE,
		beforeCreateOrUpdate(entityName, AccessType.Create)
	);
	hookManager.registerHook<ReadHookParams<G, AuthorizationContext>>(
		HookRegister.BEFORE_READ,
		beforeRead(entityName)
	);
	hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
		HookRegister.BEFORE_UPDATE,
		beforeCreateOrUpdate(entityName, AccessType.Update)
	);
	hookManager.registerHook<DeleteHookParams<G, AuthorizationContext>>(
		HookRegister.BEFORE_DELETE,
		beforeDelete(entityName)
	);

	hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
		HookRegister.AFTER_CREATE,
		afterCreateOrUpdate(entityName, AccessType.Create)
	);
	hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
		HookRegister.AFTER_UPDATE,
		afterCreateOrUpdate(entityName, AccessType.Update)
	);

	hookManagerMap.set(entityName, hookManager);
};

export function ApplyAccessControlList<G, TContext extends AuthorizationContext>(
	acl: Partial<AccessControlList<G, TContext>>
) {
	return function (constructor: any): void {
		registerAccessControlListHook(constructor.name, acl);
	};
}
