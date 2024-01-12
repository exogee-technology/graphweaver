import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSalt } from './argon2id';

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

	it('should return a salt with random Uint8Array array', async () => {
		const salt = generateSalt();
		expect(salt).toBeInstanceOf(Uint8Array);
		expect(salt.length).toBe(16);
		// The salt should be random each time
		expect(salt).not.toEqual(generateSalt());
	});
});
