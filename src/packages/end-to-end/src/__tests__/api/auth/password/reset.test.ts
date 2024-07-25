process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';

import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	ForgottenPasswordLinkData,
	AuthenticationBaseEntity,
	CredentialStorage,
	ForgottenPassword,
	Password,
} from '@exogee/graphweaver-auth';

let token = '';
const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

class ForgottenPasswordBackendProvider extends BaseDataProvider<
	AuthenticationBaseEntity<ForgottenPasswordLinkData>
> {
	private data: any;
	async find() {
		return [{}] as AuthenticationBaseEntity<ForgottenPasswordLinkData>[];
	}
	async createOne(data: any) {
		this.data = data;
		return { ...data } as AuthenticationBaseEntity<ForgottenPasswordLinkData>;
	}
	async updateOne(data: any) {
		this.data = {
			...this.data,
			...data,
		};
		return { ...this.data } as AuthenticationBaseEntity<ForgottenPasswordLinkData>;
	}
	async findOne() {
		return this.data as AuthenticationBaseEntity<ForgottenPasswordLinkData>;
	}
}

new ForgottenPassword({
	provider: new ForgottenPasswordBackendProvider('ForgottenPasswordBackendProvider'),
	sendForgottenPasswordLink: async (url: URL): Promise<boolean> => {
		token = url.searchParams.get('token') ?? '';
		return true;
	},
	getUser: async (): Promise<UserProfile<unknown>> => {
		return user;
	},
});

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	private password: string = '';

	async findOne() {
		return {
			id: '1',
			username: 'test',
			password: this.password,
			isCollection: () => false,
			isReference: () => false,
		};
	}
	async updateOne(_id: string, { password }: CredentialStorage) {
		this.password = password ?? '';
		return {} as CredentialStorage;
	}
}

new Password({
	provider: new PasswordBackendProvider('PasswordBackendProvider'),
	// This is called when a user has logged in to get the profile
	getUserProfile: async (): Promise<UserProfile<unknown>> => {
		return user;
	},
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user, { implicitAllow: true })],
	},
});

describe('Forgotten Password flow', () => {
	test('should generate a forgotten password link and allow resetting', async () => {
		const response = await graphweaver.executeOperation<{
			sendResetPasswordLink: boolean;
		}>({
			query: gql`
				mutation generateForgottenPasswordLink($username: String!) {
					sendResetPasswordLink(username: $username)
				}
			`,
			variables: {
				username: 'test',
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data?.sendResetPasswordLink).toBe(true);

		const resetPasswordResponse = await graphweaver.executeOperation<{
			resetPassword: boolean;
		}>({
			query: gql`
				mutation resetPassword($token: String!, $password: String!) {
					resetPassword(token: $token, password: $password)
				}
			`,
			variables: {
				token,
				password: 'newPassword',
			},
		});

		assert(resetPasswordResponse.body.kind === 'single');
		expect(resetPasswordResponse.body.singleResult.errors).toBeUndefined();
		expect(resetPasswordResponse.body.singleResult.data?.resetPassword).toBe(true);

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
				password: 'newPassword',
			},
		});

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		const authToken = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		expect(authToken).toContain('Bearer ');

		const payload = JSON.parse(atob(authToken?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});
});
