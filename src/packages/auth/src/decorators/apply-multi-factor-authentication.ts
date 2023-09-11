import {
	CreateOrUpdateHookParams,
	HookManager,
	HookRegister,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AuthorizationContext, ChallengeError, MultiFactorAuthentication } from '..';

export const beforeUpdate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		throw new ChallengeError('Do a challenge!', {
			entity: gqlEntityTypeName,
			provider: 'MikroBackendProvider',
		});
		return params;
	};
};

export function ApplyMultiFactorAuthentication<G>(mfa: MultiFactorAuthentication<G>) {
	return function (constructor: any): void {
		const hookManager =
			(hookManagerMap.get(constructor.name) as HookManager<G>) || new HookManager<G>();

		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_UPDATE,
			beforeUpdate(constructor.name)
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
