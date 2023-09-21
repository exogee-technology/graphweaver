process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.PASSWORD_AUTH_JWT_SECRET = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	passwordAuthApolloPlugin,
	UserProfile,
	MagicLinkAuthResolver,
	MagicLink,
} from '@exogee/graphweaver-auth';

const MOCK_TOKEN = 'D0123220-D728-4FC3-AC32-E4ACC48FC5C8';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

@Resolver()
export class AuthResolver extends MagicLinkAuthResolver {
	async getUser(_: string): Promise<UserProfile> {
		return user;
	}

	async getMagicLink(userId: string, _: string): Promise<MagicLink> {
		return { userId, token: MOCK_TOKEN, createdAt: new Date() };
	}

	async getMagicLinks(userId: string, _: Date): Promise<MagicLink[]> {
		return [{ userId, token: MOCK_TOKEN, createdAt: new Date() }];
	}

	async createMagicLink(userId: string, token: string): Promise<MagicLink> {
		return { userId, token, createdAt: new Date() };
	}

	async redeemMagicLink(_: MagicLink): Promise<boolean> {
		return true;
	}

	async emailMagicLink(_: MagicLink): Promise<boolean> {
		return true;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [passwordAuthApolloPlugin(async () => user)],
	},
});

describe('Magic Link Authentication - Login', () => {
	test('should be able to login with magic link.', async () => {
		const sendResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation sendMagicLink($username: String!) {
					sendMagicLink(username: $username)
				}
			`,
			variables: {
				username: 'test',
				password: 'test123',
			},
		});

		assert(sendResponse.body.kind === 'single');
		expect(sendResponse.body.singleResult.errors).toBeUndefined();

		const loginResponse = await graphweaver.server.executeOperation<{
			loginMagicLink: { authToken: string };
		}>({
			query: gql`
				mutation loginMagicLink($username: String!, $token: String!) {
					loginMagicLink(username: $username, token: $token) {
						authToken
					}
				}
			`,
			variables: {
				username: 'test',
				token: MOCK_TOKEN,
			},
		});

		assert(loginResponse.body.kind === 'single');

		const token = loginResponse.body.singleResult.data?.loginMagicLink?.authToken;
		expect(token).toContain('Bearer ');

		const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});
});
