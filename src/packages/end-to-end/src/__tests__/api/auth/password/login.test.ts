process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.PASSWORD_AUTH_PUBLIC_KEY_PEM_BASE64 =
	'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFcVFSUC9nem1ZdVJyR012UzJxeXpLaU05c0Z2aQpyWFRWVUsrMDBHaFFDa2NhdThOcWZsWG9nOEhyTkVsalkwWWpYcVVqOCs2ZDlySkEwTHo0NmFGSmp3PT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==';
process.env.PASSWORD_AUTH_PRIVATE_KEY_PEM_BASE64 =
	'LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUtCckcwcko5YVA0YnN0SlAyeWVNcTZsRUpUN28wcHJIdTdleHJJTjdrUXdvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFcVFSUC9nem1ZdVJyR012UzJxeXpLaU05c0Z2aXJYVFZVSyswMEdoUUNrY2F1OE5xZmxYbwpnOEhyTkVsalkwWWpYcVVqOCs2ZDlySkEwTHo0NmFGSmp3PT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo=';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	PasswordAuthResolver,
	passwordAuthApolloPlugin,
	UserProfile,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@Resolver()
export class AuthResolver extends PasswordAuthResolver {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [passwordAuthApolloPlugin(async () => user)],
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
