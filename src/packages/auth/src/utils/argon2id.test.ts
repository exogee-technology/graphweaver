import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './argon2id';

describe('Argon2', () => {
	it('should hash and verify a password', async () => {
		const passwordHash = await hashPassword('password');
		const isValid = await verifyPassword('password', passwordHash);

		expect(isValid).toBe(true);
	});

	it('should fail when password does not match hash', async () => {
		const passwordHash = await hashPassword('password');
		const isValid = await verifyPassword('not_password', passwordHash);

		expect(isValid).toBe(false);
	});
});
