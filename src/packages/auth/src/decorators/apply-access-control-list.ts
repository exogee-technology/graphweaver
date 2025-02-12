import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	HookManager,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AccessType, AccessControlList, AuthorizationContext } from '../types';
import { AclMap } from '../helper-functions';
import { afterCreateOrUpdate, beforeDelete, beforeRead, beforeCreateOrUpdate } from './hooks/acl';

interface AclRegistrationOptions {
	/**
	 * By default if an ACL already exists for the entity, an error will be thrown. If you want to override the existing ACL if already exists, set this to true.
	 */
	overrideIfExists?: boolean;
}

export const registerAccessControlListHook = <G, TContext extends AuthorizationContext>(
	entityName: string,
	acl: Partial<AccessControlList<G, TContext>>,
	options: AclRegistrationOptions = {}
) => {
	if (!options.overrideIfExists && AclMap.get(entityName)) {
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
	acl: Partial<AccessControlList<G, TContext>>,
	options: AclRegistrationOptions = {}
) {
	return function (constructor: any): void {
		registerAccessControlListHook(constructor.name, acl, options);
	};
}
