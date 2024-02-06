// @ts-ignore This file is the only one we need for the bundle
import { argon2id, argon2Verify } from 'hash-wasm/dist/argon2.umd.min.js';
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

// The defaults below are taken from the argon2 package
// https://github.com/ranisalt/node-argon2/blob/master/argon2.cjs#L33
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
