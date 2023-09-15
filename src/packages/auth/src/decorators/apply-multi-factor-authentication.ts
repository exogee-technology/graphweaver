import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
	HookManager,
	HookRegister,
	ReadHookParams,
	hasId,
	hookManagerMap,
} from '@exogee/graphweaver';
import {
	AuthenticationMethodReference,
	AuthorizationContext,
	BASE_ROLE_EVERYONE,
	ChallengeError,
	JwtPayload,
	MultiFactorAuthentication,
	MultiFactorAuthenticationRule,
	MultiFactorAuthenticationOperationType,
	getRolesFromAuthorizationContext,
	AuthenticationClassReference,
} from '..';
import { logger } from '@exogee/logger';

const MfaMap = new Map<string, Partial<MultiFactorAuthentication>>();

const setMFA = (name: string, mfa: MultiFactorAuthentication) => {
	if (MfaMap.get(name)) {
		throw new Error(`The MFA rules already exist for ${name}.`);
	}
	MfaMap.set(name, mfa);
};

const getMFA = (gqlEntityTypeName: string) => {
	const mfa = MfaMap.get(gqlEntityTypeName);
	if (!mfa) {
		logger.warn(
			`No MFA rules supplied for entity '${gqlEntityTypeName}', will continue with operation.`
		);
	}
	return mfa;
};

const beforeRead = (entityName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		await checkAuthentication(entityName, MultiFactorAuthenticationOperationType.READ, token);
		return params;
	};
};

const beforeCreate = (entityName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		await checkAuthentication(entityName, MultiFactorAuthenticationOperationType.CREATE, token);
		return params;
	};
};

const beforeUpdate = (entityName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		await checkAuthentication(entityName, MultiFactorAuthenticationOperationType.UPDATE, token);
		return params;
	};
};

const beforeDelete = (entityName: string) => {
	return async <G>(params: DeleteHookParams<G, AuthorizationContext>) => {
		const token = params.context.token;
		await checkAuthentication(entityName, MultiFactorAuthenticationOperationType.DELETE, token);
		return params;
	};
};

const getRulesForRoles = (
	mfa: Partial<MultiFactorAuthentication>, // The MFA rules for this entity
	roles: string[], // The roles assigned by the current user
	operation: MultiFactorAuthenticationOperationType // The operation performed by the user
): MultiFactorAuthenticationRule[] => {
	const rules = [] as MultiFactorAuthenticationRule[];

	// Let's loop through the rules for this entity and get a list of those that apply to the current users roles
	for (const role of [...roles, BASE_ROLE_EVERYONE]) {
		const operations = mfa[role];

		// Check if we have a matching rule for this operation
		if (operations?.[operation]) {
			const rule = operations[operation];
			if (rule) rules.push(...rule);
		}

		// Check if we have a rule that matches a write operation
		const writeOperations = [
			MultiFactorAuthenticationOperationType.CREATE,
			MultiFactorAuthenticationOperationType.UPDATE,
			MultiFactorAuthenticationOperationType.DELETE,
		];
		if (
			writeOperations.includes(operation) &&
			operations?.[MultiFactorAuthenticationOperationType.WRITE]
		) {
			const rule = operations[MultiFactorAuthenticationOperationType.WRITE];
			if (rule) rules.push(...rule);
		}

		// Check if we have a rule that matches an all operation
		if (operations?.[MultiFactorAuthenticationOperationType.ALL]) {
			const rule = operations[MultiFactorAuthenticationOperationType.ALL];
			if (rule) rules.push(...rule);
		}
	}

	return rules;
};

// Find the highest number of factors needed for this request
const maxFactorsRequired = (rules: MultiFactorAuthenticationRule[]) => {
	return rules.reduce(
		(maxFactors, rule) => (maxFactors > rule.factors ? maxFactors : rule.factors),
		0
	);
};

const authProvidersRequired = (
	rules: MultiFactorAuthenticationRule[]
): AuthenticationMethodReference[] => {
	const requiredProviders = new Set<AuthenticationMethodReference>();
	for (const rule of rules) {
		for (const provider of rule.providers) {
			requiredProviders.add(AuthenticationMethodReference[provider]);
		}
	}
	return requiredProviders.size === 0
		? [AuthenticationMethodReference.ANY]
		: [...requiredProviders];
};

const checkAuthentication = async (
	entityName: string,
	operation: MultiFactorAuthenticationOperationType,
	token?: string | JwtPayload
) => {
	// Get MFA first
	const mfa = getMFA(entityName);

	// If we have no MFA for this entity then continue
	if (!mfa) return;
	if (typeof token === 'string') throw new Error('Authentication Error: Expected JWT Payload.');

	//1. check the roles of the logged in user
	const roles = getRolesFromAuthorizationContext();
	//2. check the roles in the mfa rule
	const rules = getRulesForRoles(mfa, roles, operation);

	// No rules found for the current users role it is safe to continue
	if (rules.length === 0) return;

	//3. check the number of factors needed for this request
	const factors = maxFactorsRequired(rules);
	//4. check any required auth providers for this request
	const providers = authProvidersRequired(rules);
	//5. create the acr value that should be in the token
	const acr: AuthenticationClassReference = `urn:gw:loa:${factors}fa:${providers.join(',')}`;
	//6. check the current acr values to see if we have already authenticated
	const claimFound = token?.acr?.values?.some((value) => value === acr);

	//7. check if the claim has been met
	if (!claimFound) {
		throw new ChallengeError(
			'MFA Challenge Required: Operation requires a step up in your authentication.',
			{
				entity: entityName,
				provider: mfa,
				acr,
			}
		);
	}
};

export function ApplyMultiFactorAuthentication<G>(mfa: MultiFactorAuthentication) {
	return function (constructor: any): void {
		setMFA(constructor.name, mfa);

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
		hookManager.registerHook<CreateOrUpdateHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_CREATE,
			beforeCreate(constructor.name)
		);
		hookManager.registerHook<DeleteHookParams<G, AuthorizationContext>>(
			HookRegister.BEFORE_DELETE,
			beforeDelete(constructor.name)
		);

		hookManagerMap.set(constructor.name, hookManager);
	};
}
