process.env.LOCAL_AUTH_REDIRECT_URI = '*';
process.env.LOCAL_AUTH_JWT_SECRET = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	LocalAuthResolver,
	localAuthApolloPlugin,
	UserProfile,
	AuthProvider,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	provider: AuthProvider.LOCAL,
	roles: ['admin'],
	displayName: 'Test User',
});

@Resolver()
export class AuthResolver extends LocalAuthResolver {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [localAuthApolloPlugin(async () => user)],
	},
});

describe('Local Authentication - Login', () => {
	test('should return a valid user and successfully login.', async () => {
		const response = await graphweaver.server.executeOperation<{ login: { authToken: string } }>({
			query: gql`
				mutation login($username: String!, $password: String!) {
					login(username: $username, password: $password) {
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
		expect(response.body.singleResult.data?.login?.authToken).toContain('Bearer ');
	});

	test('should return an error when the password is incorrect.', async () => {
		const response = await graphweaver.server.executeOperation<{ login: { authToken: string } }>({
			query: gql`
				mutation login($username: String!, $password: String!) {
					login(username: $username, password: $password) {
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
