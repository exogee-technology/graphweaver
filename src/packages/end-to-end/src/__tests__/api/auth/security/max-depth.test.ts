process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, RelationshipField, Entity } from '@exogee/graphweaver';
import { UserProfile, ApplyAccessControlList, setAddUserToContext } from '@exogee/graphweaver-auth';
import { BaseAuthMethod } from '@exogee/graphweaver-auth/src/authentication/methods/base-auth-method';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const albumDataProvider = new BaseDataProvider<any>('album');

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
@Entity('Album', {
	provider: albumDataProvider,
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Artist>(() => Artist, {
		id: (artist) => artist?.id,
		nullable: true,
	})
	artist?: Artist;
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
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

describe('Security', () => {
	class FakeAuthMethod extends BaseAuthMethod {}
	new FakeAuthMethod();

	test('should check the depth of a query and error when it reaches seven.', async () => {
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');
		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.executeOperation({
			query: gql`
				query artists {
					artists {
						id
						albums {
							id
							artist {
								id
								albums {
									id
									artist {
										id
										albums {
											id
										}
									}
								}
							}
						}
					}
				}
			`,
		});

		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();
		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toContain(
			'Query depth limit of 6 exceeded'
		);
	});

	test('should check the depth of a query and error when it reaches seven on a fragment.', async () => {
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');
		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.executeOperation({
			query: gql`
				fragment artistFragment on Artist {
					albums {
						id
						artist {
							id
							albums {
								id
								artist {
									id
									albums {
										id
									}
								}
							}
						}
					}
				}
				query artists {
					artists {
						id
						...artistFragment
					}
				}
			`,
		});

		expect(spyOnArtistDataProvider).not.toHaveBeenCalled();
		expect(spyOnAlbumDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toContain(
			'Query depth limit of 6 exceeded'
		);
	});
});
