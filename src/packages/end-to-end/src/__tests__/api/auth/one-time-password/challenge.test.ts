import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	createBaseOneTimePasswordAuthResolver,
	PasswordAuthResolver,
	OneTimePassword,
} from '@exogee/graphweaver-auth';

const MOCK_CODE = '123456';
const MOCK_CREATED_AT = new Date();

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

@Resolver()
class OTPAuthResolver extends createBaseOneTimePasswordAuthResolver() {
	async getUser(_: string): Promise<UserProfile> {
		return user;
	}

	async getOTP(userId: string, code: string): Promise<OneTimePassword> {
		if (code === MOCK_CODE)
			return { userId, data: { code: MOCK_CODE }, createdAt: MOCK_CREATED_AT };
		throw new Error('No otp found');
	}

	async getOTPs(userId: string, _: Date): Promise<OneTimePassword[]> {
		return [{ userId, data: { code: MOCK_CODE }, createdAt: MOCK_CREATED_AT }];
	}

	async createOTP(userId: string, _: string): Promise<OneTimePassword> {
		return { userId, data: { code: MOCK_CODE }, createdAt: MOCK_CREATED_AT };
	}

	async redeemOTP(_: OneTimePassword): Promise<boolean> {
		return true;
	}

	async sendOTP(_: OneTimePassword): Promise<boolean> {
		return true;
	}
}

@Resolver()
export class CredentialAuthResolver extends PasswordAuthResolver {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
}

const graphweaver = new Graphweaver({
	resolvers: [OTPAuthResolver, CredentialAuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('One Time Password Authentication - Challenge', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	test('should fail challenge if not logged in.', async () => {
		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation verifyOTPChallenge($code: String!) {
					result: verifyOTPChallenge(code: $code) {
						authToken
					}
				}
			`,
			variables: {
				code: MOCK_CODE,
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Challenge unsuccessful: Username missing.'
		);
	});

	test('should fail challenge if ttl expired.', async () => {
		const loginResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation loginPassword($username: String!, $password: String!) {
					loginPassword(username: $username, password: $password) {
						authToken
					}
				}
			`,
			variables: {
				username: 'test',
				password: 'test123',
			},
		});

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		jest.spyOn(OTPAuthResolver.prototype, 'getOTP').mockImplementation(
			async () =>
				({
					userId: user.id,
					data: { code: MOCK_CODE },
					createdAt: new Date(MOCK_CREATED_AT.getDate() - 1),
				} as OneTimePassword)
		);

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation verifyOTPChallenge($code: String!) {
					result: verifyOTPChallenge(code: $code) {
						authToken
					}
				}
			`,
			variables: {
				code: MOCK_CODE,
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Challenge unsuccessful: Authentication OTP expired.'
		);
	});

	test('should pass challenge if using correct token.', async () => {
		const loginResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation loginPassword($username: String!, $password: String!) {
					loginPassword(username: $username, password: $password) {
						authToken
					}
				}
			`,
			variables: {
				username: 'test',
				password: 'test123',
			},
		});

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		const response = await graphweaver.server.executeOperation<{
			result: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation verifyOTPChallenge($code: String!) {
					result: verifyOTPChallenge(code: $code) {
						authToken
					}
				}
			`,
			variables: {
				code: MOCK_CODE,
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		// Check we have a returned token
		const steppedUpToken = response.body.singleResult.data?.result?.authToken;
		assert(steppedUpToken);
		expect(steppedUpToken).toContain('Bearer ');

		// Let's check that we have the MFA value in the token and that it has an expiry
		const payload = JSON.parse(atob(steppedUpToken?.split('.')[1] ?? '{}'));
		expect(payload.acr?.values?.otp).toBeGreaterThan(Math.floor(Date.now() / 1000));
		expect(payload.amr).toContain('otp');

		// Let's check that the original expiry has not extended
		const originalPayload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		expect(payload.exp).toBe(originalPayload.exp);
	});
});
