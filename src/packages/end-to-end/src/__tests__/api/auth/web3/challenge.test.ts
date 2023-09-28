import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	PasswordAuthResolver,
	Web3AuthResolver,
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
export class AuthResolver extends Web3AuthResolver {
	async getUserByWalletAddress(userId: string, address: string): Promise<UserProfile> {
		return user;
	}

	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
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
	resolvers: [AuthResolver, CredentialAuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Web3 Authentication - Challenge', () => {
	afterEach(() => {
		jest.resetAllMocks();
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
				mutation verifyWeb3Challenge($signature: String!, $message: String!) {
					result: verifyWeb3Challenge(signature: $signature, message: $message) {
						authToken
					}
				}
			`,
			variables: {
				signature: MOCK_CODE,
				message: 'test',
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
