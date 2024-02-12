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

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
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

@ObjectType('Track')
export class Track extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const albumDataProvider = new Provider<any, Album>('album');
albumDataProvider.backendProviderConfig = {
	filter: {
		root: true,
		parentByChild: true,
		childByChild: true,
	},
	pagination: {
		root: false,
		offset: false,
		limit: false,
	},
	orderBy: {
		root: false,
	},
	sort: {
		root: false,
	},
};

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, any>(Album, albumDataProvider) {}

const artistDataProvider = new Provider<any, Artist>('artist');

@Resolver((of) => Artist)
class ArtistResolver extends createBaseResolver<Artist, any>(Artist, artistDataProvider) {}

const trackDataProvider = new Provider<any, Track>('track');

@Resolver((of) => Track)
class TrackResolver extends createBaseResolver<Track, any>(Track, trackDataProvider) {}

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
	resolvers: [AuthResolver, TrackResolver, AlbumResolver, ArtistResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Fragments', () => {
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

	test('should return forbidden in the before read hook when filtering a nested entity when no permission applied to tracks.', async () => {
		assert(token);

		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');
		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');
		const spyOnTrackDataProvider = jest.spyOn(trackDataProvider, 'find');

		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query artists {
					artists {
						id
						albums(filter: { tracks: { id: "1" } }) {
							id
						}
					}
				}
			`,
		});

		expect(spyOnArtistDataProvider).not.toBeCalled();
		expect(spyOnAlbumDataProvider).not.toBeCalled();
		expect(spyOnTrackDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
