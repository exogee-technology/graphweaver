import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	AuthenticationBaseEntity,
	Password,
	hashPassword,
	CredentialStorage,
	OneTimePassword,
	OneTimePasswordData,
	AuthenticationMethod,
	OneTimePasswordEntity,
} from '@exogee/graphweaver-auth';

const MOCK_CODE = '123456';
const MOCK_CREATED_AT = new Date();

class OTPBackendProvider extends BaseDataProvider<AuthenticationBaseEntity<OneTimePasswordData>> {
	public async withTransaction<T>(callback: () => Promise<T>) {
		return await callback();
	}
	async findOne({ data, userId }: any) {
		if (data.code === MOCK_CODE)
			return {
				id: '1',
				userId,
				type: AuthenticationMethod.ONE_TIME_PASSWORD,
				data: { code: MOCK_CODE },
				createdAt: MOCK_CREATED_AT,
			};
		throw new Error('No otp found');
	}
	async find({ userId }: any) {
		return [
			{
				id: '1',
				userId,
				type: AuthenticationMethod.ONE_TIME_PASSWORD,
				data: { code: MOCK_CODE },
				createdAt: MOCK_CREATED_AT,
			},
		];
	}
	async createOne({ userId }: any) {
		return {
			id: '1',
			userId,
			type: AuthenticationMethod.ONE_TIME_PASSWORD,
			data: { code: MOCK_CODE },
			createdAt: MOCK_CREATED_AT,
		};
	}
}

export const oneTimePassword = new OneTimePassword({
	provider: new OTPBackendProvider('oneTimePassword'),
	sendOTP: async () => {
		return true;
	},
});

const user: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		return {
			...user,
			password: await hashPassword(user.password ?? ''),
		};
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (): Promise<UserProfile<unknown>> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user, { implicitAllow: true })],
	},
});

describe('One Time Password Authentication - Challenge', () => {
	afterEach(() => {
		jest.restoreAllMocks();
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
			'Challenge unsuccessful: Token missing.'
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

		jest.spyOn(OneTimePassword.prototype, 'getOTP').mockImplementation(
			async () =>
				({
					userId: user.id,
					data: { code: MOCK_CODE },
					createdAt: new Date(MOCK_CREATED_AT.getDate() - 1),
				}) as OneTimePasswordEntity
		);

		const response = await graphweaver.server.executeOperation({
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

		jest.spyOn(OneTimePassword.prototype, 'redeemOTP').mockImplementation(async () => true);

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
