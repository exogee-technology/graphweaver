process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';

import Graphweaver from '@exogee/graphweaver-server';
import { Provider, Resolver } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	ForgottenPasswordLinkData,
	createForgottenPasswordAuthResolver,
	AuthenticationBaseEntity,
	AccessControlList,
	AuthorizationContext,
	createAuthenticationEntity,
	Credential,
	createPasswordAuthResolver,
	CredentialStorage,
	AuthenticationType,
} from '@exogee/graphweaver-auth';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Entity, PrimaryKey, BigIntType, Property, JsonType } from '@mikro-orm/core';

@Entity()
export class Authentication<T> extends BaseEntity implements AuthenticationBaseEntity<T> {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	type!: string;

	@Property({ type: BigIntType })
	userId!: string;

	@Property({ type: JsonType })
	data!: T;

	@Property({ type: Date })
	createdAt!: Date;
}
@Entity()
class OrmCredential extends BaseEntity implements CredentialStorage {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	password!: string;
}

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const mockForgotPasswordProvider = Provider<
	AuthenticationBaseEntity<ForgottenPasswordLinkData>,
	AuthenticationBaseEntity<ForgottenPasswordLinkData>
>;

const mockPasswordProvider = Provider<OrmCredential, Credential<OrmCredential>>;

const acl: AccessControlList<Authentication<ForgottenPasswordLinkData>, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own Authentications
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any Authentications
		all: true,
	},
};

export const ForgottenPasswordLink =
	createAuthenticationEntity<Authentication<ForgottenPasswordLinkData>>(acl);

@Resolver()
export class ForgottenPasswordLinkResolver extends createForgottenPasswordAuthResolver<
	Authentication<ForgottenPasswordLinkData>
>(ForgottenPasswordLink, new mockForgotPasswordProvider('mock-forgot-provider')) {
	async sendForgottenPasswordLink(url: URL): Promise<boolean> {
		console.log(`\n\n ######## ForgotPasswordLink: ${url.toString()} ######## \n\n`);
		return true;
	}

	async getUser(username: string): Promise<UserProfile> {
		return user;
	}
}

@Resolver()
export class PasswordAuthResolver extends createPasswordAuthResolver<OrmCredential>(
	Credential,
	new mockPasswordProvider('mock-password-provider')
) {}

const graphweaver = new Graphweaver({
	resolvers: [ForgottenPasswordLinkResolver, PasswordAuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Forgotten Password flow', () => {
	let token = '';
	beforeAll(() => {
		// Forgotten Password Provider
		jest
			.spyOn(mockForgotPasswordProvider.prototype, 'createOne')
			.mockImplementation(async (res) => {
				console.log('Mocked ForgotPassword createOne');
				const link = {
					type: AuthenticationType.ForgottenPasswordLink,
					userId: user.id,
					data: {
						token: res.data.token,
						redeemedAt: 'null',
					},
				};
				token = res.data.token;
				return link;
			});
		jest.spyOn(mockForgotPasswordProvider.prototype, 'find').mockImplementation(async (data) => {
			return [data];
		});
		jest.spyOn(mockForgotPasswordProvider.prototype, 'findOne').mockImplementation(async (data) => {
			return data;
		});

		// // Password Provider
		jest.spyOn(mockPasswordProvider.prototype, 'updateOne').mockImplementation(async (data) => {
			console.log('Mocked Password updateOne');
			console.log('Data:', data);
			return data;
		});
	});

	test('should generate a forgotten password link', async () => {
		const response = await graphweaver.server.executeOperation<{
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

		console.log('Response:', JSON.stringify(response.body.singleResult.data));
	});

	// test('should reset the password via the token', async () => {
	// 	// The Authentication Save fails
	// 	const response = await graphweaver.server.executeOperation<{
	// 		passwordReset: boolean;
	// 	}>({
	// 		query: gql`
	// 			mutation resetPassword($token: String!, $password: String!) {
	// 				resetPassword(token: $token, password: $password)
	// 			}
	// 		`,
	// 		variables: {
	// 			token,
	// 			password: 'newPassword',
	// 		},
	// 	});

	// 	assert(response.body.kind === 'single');
	// 	expect(response.body.singleResult.errors).toBeUndefined();
	// 	expect(response.body.singleResult.data?.passwordReset).toBe(true);

	// 	console.log('Reset Password Response:', response.body.singleResult.data);
	// });
});
