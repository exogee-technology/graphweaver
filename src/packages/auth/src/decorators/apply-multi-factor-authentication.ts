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
import {
	AuthenticationMethodReference,
	AuthorizationContext,
	ChallengeError,
	JwtPayload,
	MultiFactorAuthentication,
} from '..';
import { logger } from '@exogee/logger';

export const MfaMap = new Map<string, Partial<MultiFactorAuthentication>>();

export const setMFA = (name: string, mfa: MultiFactorAuthentication) => {
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
		const token = params.context.token;

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
		const authChecks = items.map((item) => checkAuthentication(target, item, token));
		await Promise.all(authChecks);
		return params;
	};
};

export const checkAuthentication = async <
	G extends GraphQLEntityConstructor<GraphQLEntity<D>, D>,
	D extends BaseDataEntity
>(
	entity: G,
	requestInput: Partial<G>,
	token?: string | JwtPayload
) => {
	// Get ACL first
	const mfa = getMFA(entity.name);

	// If we have no MFA for this entity then continue
	if (!mfa) return;

	const meta = EntityMetadataMap.get(entity.name);

	if (typeof token === 'string') throw new Error('Authentication Error: Expected JWT Payload.');

	//1. check the roles of the logged in user
	//2. check the roles in the mfa rule
	//3. check the number of factors needed for this request
	//4. check any required auth providers for this request

	//5. check the current acr values to see if we have already authenticated
	const claim = token?.acr?.values?.some(
		(value) => value === `urn:gw:loa:2fa:${AuthenticationMethodReference.PASSWORD}`
	);

	//6. check is the claim has been met
	if (!claim) {
		throw new ChallengeError(
			'MFA Challenge Required: Operation requires a step up in your authentication.',
			{
				entity: entity.name,
				provider: mfa,
			}
		);
	}
};

export function ApplyMultiFactorAuthentication<G>(mfa: MultiFactorAuthentication) {
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
