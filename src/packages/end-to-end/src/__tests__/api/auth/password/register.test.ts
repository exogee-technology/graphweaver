import 'reflect-metadata';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	RequestParams,
} from '@exogee/graphweaver-auth';
import assert from 'assert';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver() {
	async authenticate(username: string, password: string) {
		return user;
	}
	async save(username: string, password: string, params: RequestParams): Promise<UserProfile> {
		return user;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Password Authentication - Register', () => {
	test('should register an unauthenticated user.', async () => {
		const response = await graphweaver.server.executeOperation<{
			createLoginPassword: { authToken: string };
		}>({
			query: gql`
				mutation createLoginPassword($username: String!, $password: String!, $confirm: String!) {
					createLoginPassword(username: $username, password: $password, confirm: $confirm) {
						authToken
					}
				}
			`,
			variables: {
				username: '',
				password: '',
				confirm: '',
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const token = response.body.singleResult.data?.createLoginPassword?.authToken;
		expect(token).toContain('Bearer ');

		const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});
});
