import {
	AccessType,
	BASE_ROLE_EVERYONE,
	MultiFactorAuthentication,
	MultiFactorAuthenticationOperationType,
	MultiFactorAuthenticationRule,
} from '../types';

export const getRulesForRoles = (
	mfa: MultiFactorAuthentication, // The MFA rules for this entity
	roles: string[], // The roles assigned by the current user
	operation: AccessType // The operation performed by the user
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
			writeOperations.includes(operation as any) &&
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
