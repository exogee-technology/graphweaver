process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	CreateOrUpdateHookParams,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	Provider,
	RelationshipField,
	Resolver,
	createBaseResolver,
} from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	Credential,
	CredentialCreateOrUpdateInputArgs,
	ApplyAccessControlList,
	AclMap,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@ObjectType('Album')
export class Album extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const albumDataProvider = new Provider<any, Album>('album');

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, any>(Album, albumDataProvider) {}

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(Credential, new Provider('auth')) {
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

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver, AlbumResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Create Or Update', () => {
	beforeAll(async () => {
		const loginResponse = await graphweaver.server.executeOperation<{
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

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		expect(token).toContain('Bearer ');
	});

	test('should return forbidden in the before create hook when user only has permission to update.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				update: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: { data: [{ description: "test" }] }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when user only has permission to create.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'updateOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				create: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: { data: [{ id: "1", description: "test" }] }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should allow in the before update hook when user has permission to create.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				create: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: { data: [{ description: "test" }] }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).toBeCalled();
	});
});
