import 'reflect-metadata';
import {
	AuthenticationMethod,
	UserProfile,
	createBaseWeb3AuthResolver,
	authApolloPlugin,
	MultiFactorAuthentication,
	createBasePasswordAuthResolver,
	AuthenticationBaseEntity,
	WalletAddress,
	AuthenticationType,
	Credential,
	RequestParams,
	CredentialCreateOrUpdateInputArgs,
} from '@exogee/graphweaver-auth';
import Graphweaver from '@exogee/graphweaver-server';
import assert from 'assert';
import gql from 'graphql-tag';
import { Resolver } from 'type-graphql';
import Web3Token from 'web3-token';
import * as Ethers from 'ethers';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { CreateOrUpdateHookParams } from '@exogee/graphweaver';

// Setup ethers for signing
const phrase =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const mnemonic = (Ethers as any).Mnemonic.fromPhrase(phrase);
const mnemonic_instance = (Ethers as any).HDNodeWallet.fromMnemonic(mnemonic);
const ethers_provider = new (Ethers as any).JsonRpcProvider();
const ethers_signer = new Ethers.Wallet(mnemonic_instance.privateKey, ethers_provider);

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

@Resolver()
class AuthResolver extends createBaseWeb3AuthResolver() {
	async getMultiFactorAuthentication(): Promise<MultiFactorAuthentication | undefined> {
		return {
			Everyone: {
				// all users must provide a magic link mfa when writing data
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
			},
		};
	}

	async getWalletAddress(
		userId: string,
		address: string
	): Promise<AuthenticationBaseEntity<WalletAddress>> {
		return {
			id: '1',
			userId,
			type: AuthenticationType.Web3WalletAddress,
			data: {
				address: address.toLowerCase(),
			},
			createdAt: new Date(),
		};
	}

	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
		return true;
	}
}

@Resolver()
class CredentialAuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new MikroBackendProvider(class OrmCred extends BaseEntity {}, {})
) {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
	async create(params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>) {
		return user;
	}
	async update(
		params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
	): Promise<UserProfile> {
		return user;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver, CredentialAuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('web3 challenge', () => {
	beforeAll(() => {
		graphweaver.startServer();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should return an OTP challenge when checking if we can enrol an web3 wallet address', async () => {
		const loginResponse = await graphweaver.server?.executeOperation<{
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
		assert(loginResponse !== undefined);

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		const response = await graphweaver.server?.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					canEnrolWallet
				}
			`,
		});
		assert(response !== undefined);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'MFA Challenge Required: Operation requires a step up in your authentication.'
		);
		expect(response.body.singleResult.errors?.[0]?.extensions?.providers).toStrictEqual(['otp']);
	});

	it('should return OTP challenge when enrolling a wallet and auth token contains no otp step up', async () => {
		const loginResponse = await graphweaver.server?.executeOperation<{
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
		assert(loginResponse !== undefined);

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		const response = await graphweaver.server?.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation enrolWallet($token: String!) {
					result: enrolWallet(token: $token)
				}
			`,
			variables: {
				token: 'MOCK TOKEN',
			},
		});
		assert(response !== undefined);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'MFA Challenge Required: Operation requires a step up in your authentication.'
		);
		expect(response.body.singleResult.errors?.[0]?.extensions?.providers).toStrictEqual(['otp']);
	});

	it('should return true for enrol wallet', async () => {
		const loginResponse = await graphweaver.server?.executeOperation<{
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
		assert(loginResponse !== undefined);

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		const web3Token = await Web3Token.sign((body: any) => ethers_signer.signMessage(body), {
			expires_in: '1d',
		});

		jest
			.spyOn(AuthResolver.prototype, 'getMultiFactorAuthentication')
			.mockImplementation(async () => undefined);

		const spy = jest.spyOn(AuthResolver.prototype, 'saveWalletAddress');
		const web3Address = await ethers_signer.getAddress();

		const response = await graphweaver.server?.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation enrolWallet($token: String!) {
					result: enrolWallet(token: $token)
				}
			`,
			variables: {
				token: web3Token,
			},
		});
		assert(response !== undefined);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(spy).toHaveBeenCalledWith(user.id, web3Address.toLowerCase());
	});

	it('should return true for verify wallet and step up the token with wb3', async () => {
		const loginResponse = await graphweaver.server?.executeOperation<{
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
		assert(loginResponse !== undefined);

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		const web3Token = await Web3Token.sign((body: any) => ethers_signer.signMessage(body), {
			expires_in: '1d',
		});

		const response = await graphweaver.server?.executeOperation<{
			result: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation verifyWeb3Challenge($token: String!) {
					result: verifyWeb3Challenge(token: $token) {
						authToken
					}
				}
			`,
			variables: {
				token: web3Token,
			},
		});
		assert(response !== undefined);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const steppedUpToken = response.body.singleResult.data?.result?.authToken;
		const payload = JSON.parse(atob(steppedUpToken?.split('.')[1] ?? '{}'));
		expect(payload.acr?.values?.wb3).toBeGreaterThan(Math.floor(Date.now() / 1000));
		expect(payload.amr).toContain('wb3');
	});
});
