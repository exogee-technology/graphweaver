import {
	AccessType,
	AuthenticationMethod,
	MultiFactorAuthentication,
	MultiFactorAuthenticationOperationType,
	MultiFactorAuthenticationRule,
} from '../types'; // Update with the correct path
import { getRulesForRoles } from './get-rules-for-roles'; // Update with the correct path

describe('getRulesForRoles', () => {
	it('should return empty array for no matching rules', () => {
		const mfa: MultiFactorAuthentication = {};
		const roles = ['user'];
		const operation = AccessType.Read;

		const result = getRulesForRoles(mfa, roles, operation);

		expect(result).toEqual([]);
	});

	it('should return matching rules for READ operation', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.READ]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Read;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for CREATE operation', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.CREATE]: [
					{
						factorsRequired: 1,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Create;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 1,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for UPDATE operation', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.UPDATE]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Update;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for DELETE operation', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.DELETE]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Delete;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for WRITE operation matching CREATE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.WRITE]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Create;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for WRITE operation matching UPDATE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.WRITE]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Update;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for WRITE operation matching DELETE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.WRITE]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Delete;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for ALL operation matching READ access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.ALL]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Read;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for ALL operation matching CREATE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.ALL]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Create;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for ALL operation matching UPDATE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.ALL]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Update;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});

	it('should return matching rules for ALL operation matching DELETE access type', () => {
		const mfa: MultiFactorAuthentication = {
			user: {
				[MultiFactorAuthenticationOperationType.ALL]: [
					{
						factorsRequired: 2,
						providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
					},
				],
			},
		};
		const roles = ['user'];
		const operation = AccessType.Delete;

		const result = getRulesForRoles(mfa, roles, operation);

		const expected: MultiFactorAuthenticationRule[] = [
			{
				factorsRequired: 2,
				providers: [AuthenticationMethod.ONE_TIME_PASSWORD],
			},
		];
		expect(result).toEqual(expected);
	});
});
