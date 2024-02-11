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
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@ApplyAccessControlList({
	Everyone: {
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

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id, nullable: true })
	artist?: Artist;
}

@ApplyAccessControlList({})
@ObjectType('Artist')
export class Artist extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

const albumDataProvider = new Provider<any, Album>('album');

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, any>(Album, albumDataProvider) {}

const artistDataProvider = new Provider<any, Artist>('artist');

@Resolver((of) => Artist)
class ArtistResolver extends createBaseResolver<Artist, any>(Artist, artistDataProvider) {}

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
	resolvers: [AuthResolver, AlbumResolver, ArtistResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Nested Before Hook', () => {
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

	test('should return forbidden in the before read hook when listing a nested entity when no permission applied.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums {
						id
						artist {
							id
						}
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnArtistDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when filtering by an entity without permission.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums(filter: { artist: { id: "1" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnArtistDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when creating a nested entity and no permission applied.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'createOne');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(data: { description: "test", artist: { description: "test" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnArtistDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when no permission to the nested entity being read.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'createOne');
		const spyOnArtistDataProviderFindOne = jest.spyOn(artistDataProvider, 'findOne');
		const spyOnArtistDataProviderFindByRelatedId = jest.spyOn(
			artistDataProvider,
			'findByRelatedId'
		);
		const spyOnArtistDataProviderFind = jest.spyOn(artistDataProvider, 'find');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(data: { description: "test" }) {
						id
						artist {
							id
						}
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnArtistDataProviderFindOne).not.toBeCalled();
		expect(spyOnArtistDataProviderFindByRelatedId).not.toBeCalled();
		expect(spyOnArtistDataProviderFind).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when no permission to the nested entity being linked.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(data: { description: "test", artist: { id: "1" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when no permission applied and updating nested entity.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(
						data: { id: 1, description: "test", artist: { id: 1, description: "test" } }
					) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnArtistDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when no permission to the nested entity being linked.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(data: { id: 1, description: "test", artist: { id: 1 } }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
