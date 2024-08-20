import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

import { generateAuthEnv, generateKeyPair } from './env';

describe('generateAuthEnv', () => {
	it('should throw an error for an invalid method', async () => {
		await expect(generateAuthEnv('invalid-method' as any)).rejects.toThrow('Invalid method');
	});

	it('should return a env file with each string key', async () => {
		const env = await generateAuthEnv('password');
		expect(env).toEqual(expect.stringContaining('AUTH_PUBLIC_KEY_PEM_BASE64='));
		expect(env).toEqual(expect.stringContaining('AUTH_PRIVATE_KEY_PEM_BASE64='));
		expect(env).toEqual(expect.stringContaining('AUTH_BASE_URI="http://localhost:9000"'));
		expect(env).toEqual(expect.stringContaining('AUTH_WHITELIST_DOMAINS="localhost"'));

		const apiKeyEnv = await generateAuthEnv('api-key');
		expect(apiKeyEnv).toEqual(expect.not.stringContaining('AUTH_PUBLIC_KEY_PEM_BASE64='));
		expect(apiKeyEnv).toEqual(expect.not.stringContaining('AUTH_PRIVATE_KEY_PEM_BASE64='));
		expect(apiKeyEnv).toEqual(expect.stringContaining('AUTH_BASE_URI="http://localhost:9000"'));
		expect(apiKeyEnv).toEqual(expect.stringContaining('AUTH_WHITELIST_DOMAINS="localhost"'));
	});
});

describe('generateKeyPair', () => {
	it('should be able to sign a JWT using the privateKey', async () => {
		const { privateKey, publicKey } = await generateKeyPair();
		const decodedPrivateKey = Buffer.from(privateKey, 'base64').toString('ascii');
		const decodedPublicKey = Buffer.from(publicKey, 'base64').toString('ascii');
		const authToken = jwt.sign({}, decodedPrivateKey, {
			algorithm: 'ES256',
			expiresIn: '8h',
		});
		expect(authToken).toBeDefined();

		// verify the token
		const decoded = jwt.verify(authToken, decodedPublicKey);
		expect(decoded).toBeDefined();
	});
});
