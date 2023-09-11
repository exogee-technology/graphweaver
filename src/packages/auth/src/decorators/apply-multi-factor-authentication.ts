import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
	HookManager,
	HookRegister,
	hasId,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AuthorizationContext, ChallengeError, MultiFactorAuthentication } from '..';
import { logger } from '@exogee/logger';

export const MfaMap = new Map<string, Partial<MultiFactorAuthentication<any>>>();

export const setMFA = <G>(name: string, mfa: MultiFactorAuthentication<G>) => {
	if (MfaMap.get(name)) {
		throw new Error(`The MFA rules already exist for ${name}.`);
	}
	MfaMap.set(name, mfa);
};

export const getMFA = (gqlEntityTypeName: string) => {
	const mfa = MfaMap.get(gqlEntityTypeName);
	if (!mfa) {
		logger.warn(
			`No MFA rules supplied for entity '${gqlEntityTypeName}', will continue with operation.`
		);
	}
	return mfa;
};

export const beforeUpdate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const items = params.args.items.filter(hasId);
		const { entity } = EntityMetadataMap.get(gqlEntityTypeName) ?? {};

		if (!entity) {
			throw new Error(
				'Raising ForbiddenError: Request rejected as no entity constructor was found'
			);
		}

		const target = entity.target as GraphQLEntityConstructor<
			GraphQLEntity<BaseDataEntity>,
			BaseDataEntity
		>;

		// 1. Check user has the correct level of authentication
		const authChecks = items.map((item) => checkAuthentication(target));
		await Promise.all(authChecks);
		return params;
	};
};

export async function checkAuthentication<
	G extends GraphQLEntityConstructor<GraphQLEntity<D>, D>,
	D extends BaseDataEntity
>(entity: G) {
	// Get ACL first
	const mfa = getMFA(entity.name);

	// If we have no MFA for this entity then continue
	if (!mfa) return;

	const meta = EntityMetadataMap.get(entity.name);

	throw new ChallengeError(
		'MFA Challenge Required: Operation requires a step up in your authentication.',
		{
			entity: entity.name,
			provider: mfa,
		}
	);
}

export function ApplyMultiFactorAuthentication<G>(mfa: MultiFactorAuthentication<G>) {
	return function (constructor: any): void {
		setMFA(constructor.name, mfa);

		const hookManager =
			(hookManagerMap.get(constructor.name) as HookManager<G>) || new HookManager<G>();

		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_UPDATE,
			beforeUpdate(constructor.name)
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
