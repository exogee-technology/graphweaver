process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider, RelationshipField } from '@exogee/graphweaver';
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

const albumDataProvider = new BaseDataProvider<any>('album');
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

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
@Entity('Album', {
	provider: albumDataProvider,
})
export class Album {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];

	@RelationshipField<Artist>(() => Artist, { relatedField: 'albums' })
	artist!: Artist;
}

const artistDataProvider = new BaseDataProvider<any>('artist');

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
@Entity('Artist', {
	provider: artistDataProvider,
})
export class Artist {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

const trackDataProvider = new BaseDataProvider<any>('track');

@Entity('Track', {
	provider: trackDataProvider,
})
export class Track {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => Album, { relatedField: 'tracks' })
	album!: Album;
}

const cred: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
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

describe('ACL - Nested Filters', () => {
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

		const response = await graphweaver.server.executeOperation({
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

		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();
		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();
		expect(spyOnTrackDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
