import {
	UserProfile,
	Passkey,
	CredentialStorage,
	hashPassword,
	Password,
	AuthenticationBaseEntity,
	AuthenticationMethod,
	PasskeyData,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';
import Graphweaver from '@exogee/graphweaver-server';
import assert from 'assert';
import gql from 'graphql-tag';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { BaseDataProvider } from '@exogee/graphweaver';

const MOCK_CHALLENGE = 'MOCK CHALLENGE';
const MOCK_CREATED_AT = new Date();

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

class PasskeyDataProvider extends BaseDataProvider<AuthenticationBaseEntity<PasskeyData>> {
	async find() {
		return [];
	}
	async createOne() {
		return {
			id: '1',
			type: AuthenticationMethod.PASSKEY,
			userId: '1',
			data: { challenge: MOCK_CHALLENGE },
			createdAt: MOCK_CREATED_AT,
		};
	}
}

export const passkey = new Passkey({
	dataProvider: new PasskeyDataProvider('Passkey'),
});

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

describe('passkey registration', () => {
	it('should allow the registration of a device', async () => {
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

		const response = await graphweaver.executeOperation<{
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
		expect(generateRegistrationOptions?.user.name).toBe(user.username);
	});
});
