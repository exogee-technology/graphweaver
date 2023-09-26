import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	OneTimePasswordAuthResolver,
	OTP,
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
export class AuthResolver extends OneTimePasswordAuthResolver {
	async getUser(_: string): Promise<UserProfile> {
		return user;
	}

	async getOTP(userId: string, code: string): Promise<OTP> {
		if (code === MOCK_CODE) return { userId, code: MOCK_CODE, createdAt: MOCK_CREATED_AT };
		throw new Error('No otp found');
	}

	async getOTPs(userId: string, _: Date): Promise<OTP[]> {
		return [{ userId, code: MOCK_CODE, createdAt: MOCK_CREATED_AT }];
	}

	async createOTP(userId: string, _: string): Promise<OTP> {
		return { userId, code: MOCK_CODE, createdAt: MOCK_CREATED_AT };
	}

	async redeemOTP(_: OTP): Promise<boolean> {
		return true;
	}

	async sendOTP(_: OTP): Promise<boolean> {
		return true;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
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
			'Challenge unsuccessful: Token missing.'
		);
	});
});
