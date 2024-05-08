import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	MagicLink,
	AuthenticationMethod,
	AuthenticationBaseEntity,
	MagicLinkData,
} from '@exogee/graphweaver-auth';

const MOCK_TOKEN = 'D0123220-D728-4FC3-AC32-E4ACC48FC5C8';
const MOCK_CREATED_AT = new Date();

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

class MagicLinkBackendProvider extends BaseDataProvider<
	AuthenticationBaseEntity<MagicLinkData>,
	AuthenticationBaseEntity<MagicLinkData>
> {
	async findOne({ data, userId }: any) {
		if (data.token === MOCK_TOKEN)
			return {
				id: '1',
				userId,
				data: { token: MOCK_TOKEN },
				createdAt: MOCK_CREATED_AT,
			} as AuthenticationBaseEntity<MagicLinkData>;
		throw new Error('No magic link found');
	}
	async find({ userId }: any) {
		return [
			{
				id: '1',
				type: AuthenticationMethod.MAGIC_LINK,
				userId,
				data: { token: MOCK_TOKEN },
				createdAt: MOCK_CREATED_AT,
			},
		];
	}
	async createOne({ userId }: any) {
		return {
			id: '1',
			type: AuthenticationMethod.MAGIC_LINK,
			userId,
			data: { token: MOCK_TOKEN },
			createdAt: MOCK_CREATED_AT,
		};
	}
}

const sendMagicLink = jest.fn(() => Promise.resolve(true));

export const magicLink = new MagicLink({
	provider: new MagicLinkBackendProvider('magicLink'),
	getUser: async (): Promise<UserProfile> => {
		return user;
	},
	sendMagicLink,
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Magic Link Authentication - Login', () => {
	test('should be able to login with magic link.', async () => {
		const redeemMagicLinkSpy = jest
			.spyOn(MagicLink.prototype, 'redeemMagicLink')
			.mockImplementation(async () => true);

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
		expect(token).toContain('Bearer ');

		const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		// Check that the token expires in the future
		expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

		// Check that the email and redeem methods have been called
		expect(sendMagicLink).toHaveBeenCalledTimes(1);
		expect(sendMagicLink).toHaveBeenCalledWith(
			new URL(
				`${process.env.AUTH_BASE_URI}/auth/login?redirect_uri=http%3A%2F%2Flocalhost%3A9000%2F&providers=${AuthenticationMethod.MAGIC_LINK}&token=${MOCK_TOKEN}&username=${user.username}`
			),
			{
				id: '1',
				type: 'mgl',
				userId: user.id,
				data: { token: MOCK_TOKEN },
				createdAt: MOCK_CREATED_AT,
			}
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
