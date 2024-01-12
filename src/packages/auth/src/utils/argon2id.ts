import { argon2id, argon2Verify } from 'hash-wasm';
import crypto from 'crypto';

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
	return argon2Verify({
		hash,
		password,
	});
};

export const hashPassword = async (password: string): Promise<string> => {
	const salt = new Uint8Array(16);
	// Fill the salt array with cryptographically secure random numbers.
	crypto.getRandomValues(salt);

	return argon2id({
		password,
		salt,
		parallelism: 4,
		iterations: 3,
		memorySize: 65536,
		hashLength: 32,
		outputType: 'encoded',
	});
};
