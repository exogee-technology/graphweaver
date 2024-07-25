import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
	Ref,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { SqliteDriver } from '@mikro-orm/sqlite';

describe('Field Aggregation', () => {
	/** Setup entities and resolvers  */
	@DataEntity({ tableName: 'Album' })
	class OrmAlbum {
		@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
		albumId!: number;

		@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
		title!: string;

		@ManyToOne({
			entity: () => OrmArtist,
			ref: true,
			fieldName: 'ArtistId',
			index: 'IFK_AlbumArtistId',
		})
		artist!: Ref<OrmArtist>;
	}

	@DataEntity({ tableName: 'Artist' })
	class OrmArtist {
		@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
		artistId!: number;

		@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
		name?: string;

		@OneToMany({ entity: () => OrmAlbum, mappedBy: 'artist' })
		albums = new Collection<OrmAlbum>(this);
	}

	const connection = {
		connectionManagerId: 'sqlite',
		mikroOrmConfig: {
			entities: [OrmAlbum, OrmArtist],
			driver: SqliteDriver,
			dbName: 'databases/database.sqlite',
		},
	};

	@Entity<Album>('Album', {
		provider: new MikroBackendProvider(OrmAlbum, connection),
	})
	class Album {
		@Field(() => ID, { primaryKeyField: true })
		albumId!: number;

		@Field(() => String, { adminUIOptions: { summaryField: true } })
		title!: string;

		@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.artistId })
		artist!: Artist;
	}

	@Entity('Artist', {
		provider: new MikroBackendProvider(OrmArtist, connection),
	})
	class Artist {
		@Field(() => ID, { primaryKeyField: true })
		artistId!: number;

		@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
		name?: string;

		@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
		albums!: Album[];
	}

	const graphweaver = new Graphweaver();

	test('should correctly aggregate nested artist queries with no filter', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					albums(pagination: { orderBy: { albumId: ASC }, limit: 2 }) {
						artist_aggregate {
							count
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect((response.body.singleResult.data as any).albums[0].artist_aggregate).toMatchObject({
			count: 1,
		});
		expect((response.body.singleResult.data as any).albums[1].artist_aggregate).toMatchObject({
			count: 1,
		});
	});

	test('should correctly aggregate nested album queries with no filter', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					artists(pagination: { orderBy: { artistId: ASC }, limit: 3 }) {
						albums_aggregate {
							count
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect((response.body.singleResult.data as any).artists[0].albums_aggregate).toMatchObject({
			count: 2,
		});
		expect((response.body.singleResult.data as any).artists[1].albums_aggregate).toMatchObject({
			count: 2,
		});
		expect((response.body.singleResult.data as any).artists[2].albums_aggregate).toMatchObject({
			count: 1,
		});
	});
});
