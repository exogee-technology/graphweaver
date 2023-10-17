import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	HookManager,
	HookParams,
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

const beforeRead = <G>(
	mfa?: (params?: ReadHookParams<G, AuthorizationContext>) => MultiFactorAuthentication
) => {
	return async (params: ReadHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa(params), AccessType.Read, token);
		return params;
	};
};

const beforeCreate = <G>(
	mfa?: (params?: CreateOrUpdateHookParams<G, AuthorizationContext>) => MultiFactorAuthentication
) => {
	return async (params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa(params), AccessType.Create, token);
		return params;
	};
};

const beforeUpdate = <G>(
	mfa?: (params?: CreateOrUpdateHookParams<G, AuthorizationContext>) => MultiFactorAuthentication
) => {
	return async (params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa(params), AccessType.Update, token);
		return params;
	};
};

const beforeDelete = <G>(
	mfa?: (params?: DeleteHookParams<G, AuthorizationContext>) => MultiFactorAuthentication
) => {
	return async (params: DeleteHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		if (mfa) await checkAuthentication(mfa(params), AccessType.Delete, token);
		return params;
	};
};

export function ApplyMultiFactorAuthentication<G>(
	mfa: (params?: HookParams<G, AuthorizationContext>) => MultiFactorAuthentication
) {
	return function (constructor: any): void {
		const hookManager =
			(hookManagerMap.get(constructor.name) as HookManager<G>) || new HookManager<G>();

		hookManager.registerHook<ReadHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_READ,
			beforeRead<G>(mfa)
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_UPDATE,
			beforeUpdate<G>(mfa)
		);
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_CREATE,
			beforeCreate<G>(mfa)
		);
		hookManager.registerHook<DeleteHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_DELETE,
			beforeDelete<G>(mfa)
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
