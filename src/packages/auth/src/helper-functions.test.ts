import { describe, it, expect } from 'vitest';
import {
	buildAccessControlEntryForUser,
	buildFieldAccessControlEntryForUser,
	getAdministratorRoleName,
} from './helper-functions';
import { AccessControlList, AccessType, AuthorizationContext, BASE_ROLE_EVERYONE } from './types';

describe('buildAccessControlEntryForUser', () => {
	it('should return a simple read consolidated acl', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				read: true,
			},
		};

		const result = buildAccessControlEntryForUser(acl, ['user']);
		expect(result).toEqual({
			Read: true,
		});
	});

	it('should return a create update and delete when setting write', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				write: true,
			},
		};

		const result = buildAccessControlEntryForUser(acl, ['user']);
		expect(result).toEqual({
			Create: true,
			Update: true,
			Delete: true,
		});
	});

	it('should return a create, read, update and delete when setting all', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				all: true,
			},
		};

		const result = buildAccessControlEntryForUser(acl, ['user']);
		expect(result).toEqual({
			Read: true,
			Create: true,
			Update: true,
			Delete: true,
		});
	});

	it('should return a create, read, update and delete when setting allSome', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				allSome: { rowFilter: true },
			},
		};

		const result = buildAccessControlEntryForUser(acl, ['user']);
		expect(result).toEqual({
			Read: true,
			Create: true,
			Update: true,
			Delete: true,
		});
	});

	it('should handle multiple roles with overlapping permissions', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { read: true },
			role2: { create: true, update: true },
		};

		const result = buildAccessControlEntryForUser(acl, ['role1', 'role2']);
		expect(result).toEqual({
			[AccessType.Read]: true,
			[AccessType.Create]: true,
			[AccessType.Update]: true,
		});
	});

	it('should prioritize "true" over row filter for conflicting permissions', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { read: true },
			role2: { read: () => ({ id: 1 }) },
		};

		const result = buildAccessControlEntryForUser(acl, ['role1', 'role2']);
		expect(result).toEqual({ [AccessType.Read]: true });
	});

	it('should prioritize "true" over row filter for conflicting permissions regardless of role order', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { read: () => ({ id: 1 }) },
			role2: { read: true },
		};

		const result = buildAccessControlEntryForUser(acl, ['role1', 'role2']);
		expect(result).toEqual({ [AccessType.Read]: true });
	});

	it('should correctly handle the "write" and "all" shorthand operations', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { write: () => ({ id: 1 }) },
			role2: { all: true },
		};

		const result = buildAccessControlEntryForUser(acl, ['role1', 'role2']);
		expect(result).toEqual({
			[AccessType.Read]: true,
			[AccessType.Create]: true,
			[AccessType.Update]: true,
			[AccessType.Delete]: true,
		});
	});

	it('should correctly handle the "write" and "allSome" shorthand operations', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { write: () => ({ id: 1 }) },
			role2: { allSome: { rowFilter: true } },
		};

		const result = buildAccessControlEntryForUser(acl, ['role1', 'role2']);
		expect(result).toEqual({
			[AccessType.Read]: true,
			[AccessType.Create]: true,
			[AccessType.Update]: true,
			[AccessType.Delete]: true,
		});
	});

	it('should grant full access to administrators', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			// Doesn't matter what's in here
		};

		const result = buildAccessControlEntryForUser(acl, [getAdministratorRoleName()]);
		expect(result).toEqual({
			[AccessType.Read]: true,
			[AccessType.Create]: true,
			[AccessType.Update]: true,
			[AccessType.Delete]: true,
		});
	});

	it('should include permissions from the "everyone" base role', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			[BASE_ROLE_EVERYONE]: { read: true }, // Assuming you have BASE_ROLE_EVERYONE defined
		};

		const result = buildAccessControlEntryForUser(acl, []); // No explicit roles
		expect(result).toEqual({ [AccessType.Read]: true });
	});

	it('should throw an error for invalid ACL operations', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			role1: { invalidOperation: true } as any,
		};

		expect(() => buildAccessControlEntryForUser(acl, ['role1'])).toThrowError(
			'Encountered invalid ACL'
		);
	});
});

describe('buildFieldAccessControlEntryForUser', () => {
	it('should return prevented fields on a simple read field access call', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				readSome: {
					fieldRestrictions: ['id'],
					rowFilter: true,
				},
			},
		};

		const result = buildFieldAccessControlEntryForUser(acl, ['user'], {});
		expect(result).toEqual(new Set(['id']));
	});

	it('should return an empty set if no roles match', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			admin: { readSome: true },
		};
		const result = buildFieldAccessControlEntryForUser(acl, ['user'], {});
		expect(result).toEqual(new Set());
	});

	it('should handle multiple roles with field restrictions', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				readSome: {
					fieldRestrictions: ['id'],
					rowFilter: true,
				},
			},
			manager: {
				readSome: {
					fieldRestrictions: ['name', 'email'],
					rowFilter: true,
				},
			},
		};

		const result = buildFieldAccessControlEntryForUser(acl, ['user', 'manager'], {});
		expect(result).toEqual(new Set(['id', 'name', 'email']));
	});

	it('should ignore access control values without fieldRestrictions', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				read: true, // No field restrictions
			},
		};

		const result = buildFieldAccessControlEntryForUser(acl, ['user'], {});
		expect(result).toEqual(new Set());
	});

	it('should handle field restrictions as a function of the context', () => {
		const acl: Partial<AccessControlList<any, AuthorizationContext>> = {
			user: {
				readSome: {
					fieldRestrictions: (context: AuthorizationContext) =>
						context.user?.roles?.includes('admin') ? [] : ['sensitiveData'],
					rowFilter: true,
				},
			},
		};

		const result1 = buildFieldAccessControlEntryForUser(acl, ['user'], {
			user: { roles: ['admin'] },
		});
		expect(result1).toEqual(new Set());

		const result2 = buildFieldAccessControlEntryForUser(acl, ['user'], { user: { roles: [] } });
		expect(result2).toEqual(new Set(['sensitiveData']));
	});
});
