import {
	AuthenticationMethod,
	UserProfile,
	WalletAddress,
	CredentialStorage,
	hashPassword,
	Password,
	Web3,
	AuthenticationBaseEntity,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';
import Graphweaver from '@exogee/graphweaver-server';
import assert from 'assert';
import gql from 'graphql-tag';
import Web3Token from 'web3-token';
import ethers from 'ethers';
import { BaseDataProvider } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */
// Setup ethers for signing

const phrase =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const mnemonic_instance = ethers.Wallet.fromMnemonic(phrase);
const ethers_provider = new ethers.providers.JsonRpcProvider();
const ethers_signer = new ethers.Wallet(mnemonic_instance.privateKey, ethers_provider);

class WalletAddressBackendProvider extends BaseDataProvider<
	AuthenticationBaseEntity<WalletAddress>
> {
	public async withTransaction<T>(callback: () => Promise<T>) {
		return await callback();
	}
	async findOne({ userId, data }: any) {
		return {
			id: '1',
			userId,
			type: AuthenticationMethod.WEB3,
			data: {
				address: data.address.toLowerCase(),
			},
			createdAt: new Date(),
		};
	}
	async createOne(...args: any) {
		console.log(args);
		return {
			id: '1',
			userId: '1',
			type: AuthenticationMethod.WEB3,
			data: {
				address: '0x1234567890123456789012345678901234567890',
			},
			createdAt: new Date(),
		};
	}
}

export const web3 = new Web3({
	provider: new WalletAddressBackendProvider('WalletAddress'),
	multiFactorAuthentication: async () => ({
		Everyone: {
			// all users must provide a OTP mfa when saving a wallet address
			Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
		},
	}),
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
	getUserProfile: async (id: string): Promise<UserProfile<unknown>> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

setAddUserToContext(async () => ({
	...user,
	roles: ['user'],
}));

const graphweaver = new Graphweaver();

describe('web3 challenge', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should return an OTP challenge when checking if we can enrol an web3 wallet address', async () => {
		const loginResponse = await graphweaver.executeOperation<{
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

		const response = await graphweaver.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					canEnrolWallet
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'MFA Challenge Required: Operation requires a step up in your authentication.'
		);
		expect(response.body.singleResult.errors?.[0]?.extensions?.providers).toStrictEqual(['otp']);
	});

	it('should return OTP challenge when enrolling a wallet and auth token contains no otp step up', async () => {
		const loginResponse = await graphweaver.executeOperation<{
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

		const response = await graphweaver.executeOperation({
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'MFA Challenge Required: Operation requires a step up in your authentication.'
		);
		expect(response.body.singleResult.errors?.[0]?.extensions?.providers).toStrictEqual(['otp']);
	});

	it('should return true for enrol wallet', async () => {
		const loginResponse = await graphweaver.executeOperation<{
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

		const web3Token = await Web3Token.sign((body: any) => ethers_signer.signMessage(body), {
			expires_in: '1d',
		});

		jest.spyOn(web3 as any, 'multiFactorAuthentication').mockImplementation(() => undefined);

		const spy = jest.spyOn(Web3.prototype, 'saveWalletAddress');
		const web3Address = await ethers_signer.getAddress();

		const response = await graphweaver.executeOperation({
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(spy).toHaveBeenCalledWith(user.id, web3Address.toLowerCase());
	});

	it('should return true for verify wallet and step up the token with wb3', async () => {
		const loginResponse = await graphweaver.executeOperation<{
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

		const web3Token = await Web3Token.sign((body: any) => ethers_signer.signMessage(body), {
			expires_in: '1d',
		});

		const response = await graphweaver.executeOperation<{
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const steppedUpToken = response.body.singleResult.data?.result?.authToken;
		const payload = JSON.parse(atob(steppedUpToken?.split('.')[1] ?? '{}'));
		expect(payload.acr?.values?.wb3).toBeGreaterThan(Math.floor(Date.now() / 1000));
		expect(payload.amr).toContain('wb3');
	});
});
