import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	HookManager,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '@exogee/graphweaver';

import {
	AccessType,
	AuthorizationContext,
	MultiFactorAuthentication,
	checkAuthentication,
} from '..';

const beforeRead = (mfa?: Partial<MultiFactorAuthentication>) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) checkAuthentication(mfa, AccessType.Read, token);
		return params;
	};
};

const beforeCreate = (mfa?: Partial<MultiFactorAuthentication>) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) checkAuthentication(mfa, AccessType.Create, token);
		return params;
	};
};

const beforeUpdate = (mfa?: Partial<MultiFactorAuthentication>) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa, AccessType.Update, token);
		return params;
	};
};

const beforeDelete = (mfa?: Partial<MultiFactorAuthentication>) => {
	return async <G>(params: DeleteHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa, AccessType.Delete, token);
		return params;
	};
};

export function ApplyMultiFactorAuthentication<G>(mfa: MultiFactorAuthentication) {
	return function (constructor: any): void {
		const hookManager =
			(hookManagerMap.get(constructor.name) as HookManager<G>) || new HookManager<G>();

		hookManager.registerHook<ReadHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_READ,
			beforeRead(mfa)
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_UPDATE,
			beforeUpdate(mfa)
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_CREATE,
			beforeCreate(mfa)
		);
		hookManager.registerHook<DeleteHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_DELETE,
			beforeDelete(mfa)
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
