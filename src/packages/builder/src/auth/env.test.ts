import { describe, it, expect } from 'vitest';
import { generateAuthEnv } from './env';

describe('generateKeyPair', () => {
	it('should return a env file with each string key', async () => {
		const env = await generateAuthEnv();
		expect(env).toEqual(expect.stringContaining('AUTH_PUBLIC_KEY_PEM_BASE64='));
		expect(env).toEqual(expect.stringContaining('AUTH_PRIVATE_KEY_PEM_BASE64='));
		expect(env).toEqual(expect.stringContaining('AUTH_BASE_URI="http://localhost:9000"'));
		expect(env).toEqual(expect.stringContaining('AUTH_WHITELIST_DOMAINS="localhost"'));
	});
});
