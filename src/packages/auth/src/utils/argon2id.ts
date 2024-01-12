import { argon2id, argon2Verify } from 'hash-wasm';
import crypto from 'crypto';

export const generateSalt = (): Uint8Array => {
	const salt = new Uint8Array(16);
	// Fill the salt array with cryptographically secure random numbers.
	return crypto.getRandomValues(salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> =>
	argon2Verify({
		hash,
		password,
	});

export const hashPassword = async (password: string): Promise<string> =>
	argon2id({
		password,
		salt: generateSalt(),
		parallelism: 4,
		iterations: 3,
		memorySize: 65536,
		hashLength: 32,
		outputType: 'encoded',
	});
