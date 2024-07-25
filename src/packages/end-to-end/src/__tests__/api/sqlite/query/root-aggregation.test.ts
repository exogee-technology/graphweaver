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

describe('Root Aggregation', () => {
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

	test('should correctly aggregate root album queries with no filter', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					albums_aggregate {
						count
					}
				}
			`,
		});

		assert(response.body.kind === 'single');

		expect(response.body.singleResult.data?.albums_aggregate).toMatchObject({
			count: 347,
		});
	});

	test('should correctly aggregate root album queries with a filter', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					albums_aggregate(
						filter: { title_in: ["Balls to the Wall", "Restless and Wild", "Let There Be Rock"] }
					) {
						count
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.albums_aggregate).toMatchObject({
			count: 3,
		});
	});
});
