import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	MagicLinkAuthResolver,
	MagicLink,
} from '@exogee/graphweaver-auth';

const MOCK_TOKEN = 'D0123220-D728-4FC3-AC32-E4ACC48FC5C8';
const MOCK_CREATED_AT = new Date();

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

	async getMagicLink(userId: string, token: string): Promise<MagicLink> {
		if (token === MOCK_TOKEN) return { userId, token: MOCK_TOKEN, createdAt: MOCK_CREATED_AT };
		throw new Error('No magic link found');
	}

	async getMagicLinks(userId: string, _: Date): Promise<MagicLink[]> {
		return [{ userId, token: MOCK_TOKEN, createdAt: MOCK_CREATED_AT }];
	}

	async createMagicLink(userId: string, _: string): Promise<MagicLink> {
		return { userId, token: MOCK_TOKEN, createdAt: MOCK_CREATED_AT };
	}

	async redeemMagicLink(_: MagicLink): Promise<boolean> {
		return true;
	}

	async sendMagicLink(_: URL): Promise<boolean> {
		return true;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Magic Link Authentication - Challenge', () => {
	test('should fail challenge if not logged in.', async () => {
		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation verifyChallengeMagicLink($token: String!) {
					result: verifyChallengeMagicLink(token: $token) {
						authToken
					}
				}
			`,
			variables: {
				token: MOCK_TOKEN,
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Challenge unsuccessful: Token missing.'
		);
	});

	test('should fail challenge if using incorrect token.', async () => {
		const sendResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation sendLoginMagicLink($username: String!) {
					sendLoginMagicLink(username: $username)
				}
			`,
			variables: {
				username: 'test',
			},
		});

		assert(sendResponse.body.kind === 'single');
		expect(sendResponse.body.singleResult.errors).toBeUndefined();

		const loginResponse = await graphweaver.server.executeOperation<{
			verifyLoginMagicLink: { authToken: string };
		}>({
			query: gql`
				mutation verifyLoginMagicLink($username: String!, $token: String!) {
					verifyLoginMagicLink(username: $username, token: $token) {
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

		const token = loginResponse.body.singleResult.data?.verifyLoginMagicLink?.authToken;
		assert(token);

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation verifyChallengeMagicLink($token: String!) {
					result: verifyChallengeMagicLink(token: $token) {
						authToken
					}
				}
			`,
			variables: {
				token: 'FAKE TOKEN',
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Magic Link authentication failed.'
		);
	});

	test('should fail challenge if ttl expired.', async () => {
		const sendResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation sendLoginMagicLink($username: String!) {
					sendLoginMagicLink(username: $username)
				}
			`,
			variables: {
				username: 'test',
			},
		});

		assert(sendResponse.body.kind === 'single');
		expect(sendResponse.body.singleResult.errors).toBeUndefined();

		const loginResponse = await graphweaver.server.executeOperation<{
			verifyLoginMagicLink: { authToken: string };
		}>({
			query: gql`
				mutation verifyLoginMagicLink($username: String!, $token: String!) {
					verifyLoginMagicLink(username: $username, token: $token) {
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

		const token = loginResponse.body.singleResult.data?.verifyLoginMagicLink?.authToken;
		assert(token);

		jest.spyOn(AuthResolver.prototype, 'getMagicLink').mockImplementation(
			async () =>
				({
					userId: user.id,
					token: MOCK_TOKEN,
					createdAt: new Date(MOCK_CREATED_AT.getDate() - 1),
				} as MagicLink)
		);

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation verifyChallengeMagicLink($token: String!) {
					result: verifyChallengeMagicLink(token: $token) {
						authToken
					}
				}
			`,
			variables: {
				token: MOCK_TOKEN,
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Auth unsuccessful: Authentication Magic Link expired.'
		);
	});
});
