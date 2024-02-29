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
	BaseDataProvider,
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
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@ApplyAccessControlList({
	ROLE_NOT_FOUND_IN_USER_PROFILE: {
		all: true,
	},
})
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
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new BaseDataProvider('auth')
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

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver, AlbumResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Basic Before Hook', () => {
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

	test('should return forbidden in the before read hook when listing a single entity when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'findOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					album(id: 1) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity multiple times when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query queryOne {
					albums {
						id
					}
					result: albums {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(data: { description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(data: { id: 1, description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before delete hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'deleteOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: deleteAlbum(filter: { id: 1 })
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before delete hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'deleteMany');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: deleteAlbums(filter: { id: 1 })
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
