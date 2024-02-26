import 'reflect-metadata';
import {
	UserProfile,
	createBasePasskeyAuthResolver,
	authApolloPlugin,
	PasskeyAuthenticatorDevice,
	createBasePasswordAuthResolver,
	Credential,
	CredentialCreateOrUpdateInputArgs,
} from '@exogee/graphweaver-auth';
import Graphweaver from '@exogee/graphweaver-server';
import assert from 'assert';
import gql from 'graphql-tag';
import { Resolver } from 'type-graphql';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { CreateOrUpdateHookParams, Provider } from '@exogee/graphweaver';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

const MOCK_CHALLENGE = 'MOCK CHALLENGE';

@Resolver()
class AuthResolver extends createBasePasskeyAuthResolver() {
	public async getUserCurrentChallenge(userId: string): Promise<string> {
		return MOCK_CHALLENGE;
	}

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {
		return true;
	}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {
		return [];
	}

	public async getUserAuthenticator(
		_: string,
		credentialID: string
	): Promise<PasskeyAuthenticatorDevice> {
		return {
			id: '1',
			credentialID,
			counter: 1,
			credentialPublicKey: 'test',
		};
	}

	public async saveNewUserAuthenticator(
		_: string,
		__: PasskeyAuthenticatorDevice
	): Promise<boolean> {
		return true;
	}

	public async saveUpdatedAuthenticatorCounter(_: string, __: number): Promise<boolean> {
		return true;
	}
}

@Resolver()
class CredentialAuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new Provider('my-provider')
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

describe('passkey registration', () => {
	it('should allow the registration of a device', async () => {
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
			result: PublicKeyCredentialCreationOptionsJSON;
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: passkeyGenerateRegistrationOptions
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const generateRegistrationOptions = response.body.singleResult.data?.result;
		assert(generateRegistrationOptions);

		expect(generateRegistrationOptions?.challenge).toBeDefined();
		expect(generateRegistrationOptions?.user.id).toBe(user.id);
	});
});
