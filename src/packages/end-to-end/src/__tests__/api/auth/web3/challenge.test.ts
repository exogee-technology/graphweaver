import 'reflect-metadata';
import {
	AuthenticationMethod,
	UserProfile,
	Web3AuthResolver,
	authApolloPlugin,
	MultiFactorAuthentication,
	PasswordAuthResolver,
} from '@exogee/graphweaver-auth';
import Graphweaver from '@exogee/graphweaver-server';
import assert from 'assert';
import gql from 'graphql-tag';
import { Resolver } from 'type-graphql';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

@Resolver()
export class AuthResolver extends Web3AuthResolver {
	async getMultiFactorAuthentication(): Promise<MultiFactorAuthentication> {
		return {
			Everyone: {
				// all users must provide a magic link mfa when writing data
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
			},
		};
	}

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

describe('web3 challenge', () => {
	it('should return an OTP challenge when checking if we can enrol an web3 wallet address', async () => {
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
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					canEnrolWallet
				}
			`,
			variables: {
				data: {
					id: '1',
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'MFA Challenge Required: Operation requires a step up in your authentication.'
		);
		expect(response.body.singleResult.errors?.[0]?.extensions?.providers).toStrictEqual(['otp']);
	});
});
