process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	Credential,
	Password,
	CredentialStorage,
	PasswordOperation,
	hashPassword,
} from '@exogee/graphweaver-auth';

const user: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		user.password = await hashPassword(user.password ?? '');
		return user;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (
		id: string,
		operation: PasswordOperation
	): Promise<UserProfile<unknown>> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Password Authentication - Login', () => {
	test('should return a valid user and successfully login.', async () => {
		const response = await graphweaver.server.executeOperation<{
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const token = response.body.singleResult.data?.loginPassword?.authToken;
		expect(token).toContain('Bearer ');

		const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});

	test('should return an error when the password is incorrect.', async () => {
		const response = await graphweaver.server.executeOperation<{
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
				password: 'incorrect',
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeDefined();
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Unknown username or password, please try again'
		);
	});
});
