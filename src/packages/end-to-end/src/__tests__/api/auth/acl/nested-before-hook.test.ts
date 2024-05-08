process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Field,
	GraphQLEntity,
	ID,
	Entity,
	BaseDataProvider,
	RelationshipField,
} from '@exogee/graphweaver';
import {
	CredentialStorage,
	authApolloPlugin,
	UserProfile,
	Credential,
	hashPassword,
	Password,
	ApplyAccessControlList,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const albumDataProvider = new BaseDataProvider<any, Album>('album');

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
@Entity('Album', {
	provider: albumDataProvider,
})
export class Album extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id, nullable: true })
	artist?: Artist;
}

const artistDataProvider = new BaseDataProvider<any, Artist>('artist');

@ApplyAccessControlList({})
@Entity('Artist', {
	provider: artistDataProvider,
})
export class Artist extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

const cred: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
	isCollection: () => false,
	isReference: () => false,
};

class PasswordBackendProvider extends BaseDataProvider<
	CredentialStorage,
	Credential<CredentialStorage>
> {
	async findOne() {
		cred.password = await hashPassword(cred.password ?? '');
		return cred;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (id: string) => user,
});

const graphweaver = new Graphweaver({
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

		const response = await graphweaver.server.executeOperation({
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

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing a nested entity when no permission applied and renaming the field.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums {
						id
						album: artist {
							id
						}
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when filtering by an entity without permission.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums(filter: { artist: { id: "1" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when creating a nested entity and no permission applied.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'createOne');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(input: { description: "test", artist: { description: "test" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();

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

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(input: { description: "test" }) {
						id
						artist {
							id
						}
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProviderFindOne).not.toHaveBeenCalled();
		expect(spyOnArtistDataProviderFindByRelatedId).not.toHaveBeenCalled();
		expect(spyOnArtistDataProviderFind).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when no permission to the nested entity being linked.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(input: { description: "test", artist: { id: "1" } }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when no permission applied and updating nested entity.', async () => {
		assert(token);

		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(
						input: { id: 1, description: "test", artist: { id: 1, description: "test" } }
					) {
						id
					}
				}
			`,
		});

		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when no permission to the nested entity being linked.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(input: { id: 1, description: "test", artist: { id: 1 } }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
