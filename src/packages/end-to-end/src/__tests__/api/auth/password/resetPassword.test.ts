process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import { MySqlDriver } from '@mikro-orm/mysql';

import Graphweaver from '@exogee/graphweaver-server';
import { CreateOrUpdateHookParams, EntityMetadataMap, Resolver } from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	Credential,
	CredentialCreateOrUpdateInputArgs,
	ForgottenPasswordLinkData,
	createForgottenPasswordAuthResolver,
	AuthenticationBaseEntity,
	AccessControlList,
	AuthorizationContext,
	createAuthenticationEntity,
} from '@exogee/graphweaver-auth';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Entity, PrimaryKey, BigIntType, Property, JsonType } from '@mikro-orm/core';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

// mock the data provider

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new MikroBackendProvider(class OrmCredential extends BaseEntity {}, {})
) {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
	async create(params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>) {
		return user;
	}
	async update(
		params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
	): Promise<UserProfile> {
		return user;
	}
}
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

// export const myConnection = {
// 	connectionManagerId: 'my-sql',
// 	mikroOrmConfig: {
// 		entities: [Authentication, Credential],
// 		driver: MySqlDriver,
// 		dbName: 'todo_app',
// 		user: process.env.DATABASE_USERNAME,
// 		password: process.env.DATABASE_PASSWORD,
// 		port: 3306,
// 	},
// };

@Resolver()
export class ForgottenPasswordLinkResolver extends createForgottenPasswordAuthResolver<
	Authentication<ForgottenPasswordLinkData>
>(ForgottenPasswordLink, new MikroBackendProvider(Authentication<ForgottenPasswordLinkData>, {})) {
	async sendForgottenPasswordLink(url: URL): Promise<boolean> {
		// In a production system this would email / sms the forgotten link and you would not log to the console!
		console.log(`\n\n ######## ForgotPasswordLink: ${url.toString()} ######## \n\n`);
		return true;
	}

	async getUser(username: string): Promise<UserProfile> {
		return user;

		// const provider = EntityMetadataMap.get('Credential')?.provider as MikroBackendProvider<
		// 	any,
		// 	any
		// >;

		// if (!provider) throw new Error('Bad Request: Unknown provider.');

		// const user = await provider?.findOne({ username });

		// if (!user) throw new Error('Bad Request: Unknown user id provided.');

		// return user;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver, ForgottenPasswordLinkResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Forgotten Password flow', () => {
	// test('should return a valid user and successfully login.', async () => {
	// 	const response = await graphweaver.server.executeOperation<{
	// 		loginPassword: { authToken: string };
	// 	}>({
	// 		query: gql`
	// 			mutation loginPassword($username: String!, $password: String!) {
	// 				loginPassword(username: $username, password: $password) {
	// 					authToken
	// 				}
	// 			}
	// 		`,
	// 		variables: {
	// 			username: 'test',
	// 			password: 'test123',
	// 		},
	// 	});

	// 	assert(response.body.kind === 'single');
	// 	expect(response.body.singleResult.errors).toBeUndefined();

	// 	const token = response.body.singleResult.data?.loginPassword?.authToken;
	// 	expect(token).toContain('Bearer ');

	// 	const payload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
	// 	// Check that the token expires in the future
	// 	expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	// });

	test('should generate a forgotten password link', async () => {
		console.log('*****************\n*******************\n');
		const response = await graphweaver.server.executeOperation<{
			sendResetPasswordLink: boolean;
		}>({
			query: gql`
				mutation xyz($username: String!) {
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
	});
});
