import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	createBaseMagicLinkAuthResolver,
	MagicLink,
	AuthenticationMethod,
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
class AuthResolver extends createBaseMagicLinkAuthResolver() {
	async getUser(_: string): Promise<UserProfile> {
		return user;
	}

	async getMagicLink(userId: string, token: string): Promise<MagicLink> {
		if (token === MOCK_TOKEN)
			return { id: '1', userId, data: { token: MOCK_TOKEN }, createdAt: MOCK_CREATED_AT };
		throw new Error('No magic link found');
	}

	async getMagicLinks(userId: string, _: Date): Promise<MagicLink[]> {
		return [{ id: '1', userId, data: { token: MOCK_TOKEN }, createdAt: MOCK_CREATED_AT }];
	}

	async createMagicLink(userId: string, _: string): Promise<MagicLink> {
		return { id: '1', userId, data: { token: MOCK_TOKEN }, createdAt: MOCK_CREATED_AT };
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

describe('Magic Link Authentication - Login', () => {
	test('should be able to login with magic link.', async () => {
		const sendMagicLinkSpy = jest
			.spyOn(AuthResolver.prototype, 'sendMagicLink')
			.mockImplementation(async () => true);

		const redeemMagicLinkSpy = jest
			.spyOn(AuthResolver.prototype, 'redeemMagicLink')
			.mockImplementation(async () => true);

		graphweaver.startServer();

		const sendResponse = await graphweaver.server?.executeOperation<{
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
		assert(sendResponse !== undefined);

		assert(sendResponse.body.kind === 'single');
		expect(sendResponse.body.singleResult.errors).toBeUndefined();

		const loginResponse = await graphweaver.server?.executeOperation<{
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
		assert(loginResponse !== undefined);

		assert(loginResponse.body.kind === 'single');

		const token = loginResponse.body.singleResult.data?.verifyLoginMagicLink?.authToken;
		expect(token).toContain('Bearer ');

		const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

		// Check that the email and redeem methods have been called
		expect(sendMagicLinkSpy).toHaveBeenCalledTimes(1);
		expect(sendMagicLinkSpy).toHaveBeenCalledWith(
			new URL(
				`${process.env.AUTH_BASE_URI}/auth/login?redirect_uri=http%3A%2F%2Flocalhost%3A9000%2F&providers=${AuthenticationMethod.MAGIC_LINK}&token=${MOCK_TOKEN}&username=${user.username}`
			),
			{ id: '1', userId: user.id, data: { token: MOCK_TOKEN }, createdAt: MOCK_CREATED_AT }
		);
		expect(redeemMagicLinkSpy).toHaveBeenCalledTimes(1);
		expect(redeemMagicLinkSpy).toHaveBeenCalledWith({
			id: '1',
			userId: user.id,
			data: { token: MOCK_TOKEN },
			createdAt: MOCK_CREATED_AT,
		});
	});
});
