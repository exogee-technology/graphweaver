process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	BaseDataProvider,
	RelationshipField,
	Resolver,
	createBaseResolver,
} from '@exogee/graphweaver';
import { authApolloPlugin, UserProfile, ApplyAccessControlList } from '@exogee/graphweaver-auth';

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

const albumDataProvider = new BaseDataProvider<any, Album>('album');

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, any>(Album, albumDataProvider) {}

const artistDataProvider = new BaseDataProvider<any, Artist>('artist');

@Resolver((of) => Artist)
class ArtistResolver extends createBaseResolver<Artist, any>(Artist, artistDataProvider) {}

const graphweaver = new Graphweaver({
	resolvers: [AlbumResolver, ArtistResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Security', () => {
	test('should check the depth of a query and error when it reaches seven.', async () => {
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');
		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
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

		expect(spyOnArtistDataProvider).not.toBeCalled();
		expect(spyOnAlbumDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toContain(
			'Query depth limit of 6 exceeded'
		);
	});

	test('should check the depth of a query and error when it reaches seven on a fragment.', async () => {
		const spyOnArtistDataProvider = jest.spyOn(artistDataProvider, 'find');
		const spyOnAlbumDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
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

		expect(spyOnArtistDataProvider).not.toBeCalled();
		expect(spyOnAlbumDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toContain(
			'Query depth limit of 6 exceeded'
		);
	});
});
