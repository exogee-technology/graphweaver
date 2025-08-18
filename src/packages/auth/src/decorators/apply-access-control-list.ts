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
import { apolloPluginManager, pluginManager } from '@exogee/graphweaver-server';

interface AclRegistrationOptions {
	/**
	 * By default if an ACL already exists for the entity, an error will be thrown. If you want to override the existing ACL if already exists, set this to true.
	 */
	overrideIfExists?: boolean;
}

// We should only do this check once for performance reasons.
let hasCheckedForAuthMethods = false;

export const registerAccessControlListHook = <G, TContext extends AuthorizationContext>(
	entityName: string,
	acl: Partial<AccessControlList<G, TContext>>,
	options: AclRegistrationOptions = {}
) => {
	// It's possible to accidentally misconfigure the system so there's an ACL applied to an entity but not
	// have the auth method brought in at all. If you do this, then the system works in a weirdly default
	// accessible way. We should catch this situation and throw an error.
	apolloPluginManager.addPlugin('CheckForAuthMethodOnServerStart', {
		async requestDidStart() {
			if (!hasCheckedForAuthMethods) {
				hasCheckedForAuthMethods = true;
				console.log('[...pluginManager.getPlugins()]', [...pluginManager.getPlugins()]);

				if (![...pluginManager.getPlugins()].find((p) => p.name === 'AuthRequestContextPlugin')) {
					throw new Error(
						'No auth methods have been registered, but an ACL has been applied to an entity. Please ensure that an auth method is ' +
							'registered in the server configuration. The usual way to accidentally do this is to not ' +
							'import the file you have defined the auth method in.'
					);
				}
			}
		},
	});

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
