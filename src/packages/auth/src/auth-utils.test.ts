import { describe, it, expect } from 'vitest';
import { ForbiddenError } from 'apollo-server-errors';
import { requiredPermissionsForAction } from './auth-utils';
import { AccessType } from './types';

describe('requiredPermissionsForAction', () => {
	it('treats a single default id primary key as Read', () => {
		expect(requiredPermissionsForAction({ id: '123' })).toBe(AccessType.Read);
	});

	it('treats an id primary key plus other fields as Update', () => {
		expect(requiredPermissionsForAction({ id: '123', name: 'Alice' })).toBe(AccessType.Update);
	});

	it('treats a payload without an id primary key as Create', () => {
		expect(requiredPermissionsForAction({ name: 'Alice' })).toBe(AccessType.Create);
	});

	it('treats a single non-id primary key as Read', () => {
		expect(requiredPermissionsForAction({ appId: '82000' }, 'appId')).toBe(AccessType.Read);
	});

	it('treats a non-id primary key plus other fields as Update', () => {
		expect(requiredPermissionsForAction({ appId: '82000', name: 'Deal' }, 'appId')).toBe(
			AccessType.Update
		);
	});

	it('treats a payload without the entity primary key as Create even if id is present', () => {
		// Entities whose PK is not `id` must not be misclassified via a stray `id` field.
		expect(requiredPermissionsForAction({ id: 'not-the-pk', name: 'Deal' }, 'appId')).toBe(
			AccessType.Create
		);
	});

	it('does not treat { appId } as Create when using the default id primary key field', () => {
		// Regression: after-create ACL previously hardcoded `id`, so linking via `{ appId }`
		// required Create on the related entity instead of Read.
		expect(requiredPermissionsForAction({ appId: '82000' })).toBe(AccessType.Create);
		expect(requiredPermissionsForAction({ appId: '82000' }, 'appId')).toBe(AccessType.Read);
	});

	it('throws Forbidden for an empty intent', () => {
		expect(() => requiredPermissionsForAction({})).toThrow(ForbiddenError);
	});
});
