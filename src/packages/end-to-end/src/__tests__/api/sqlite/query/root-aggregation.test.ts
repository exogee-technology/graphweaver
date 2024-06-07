import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	ArrayType,
	Entity as DataEntity,
	Collection,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { SqliteDriver } from '@mikro-orm/sqlite';
// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ type: ArrayType, default: [] })
	title!: string[];

	@ManyToOne({
		entity: () => OrmArtist,
		ref: true,
		fieldName: 'ArtistId',
		index: 'IFK_AlbumArtistId',
	})
	artist!: OrmArtist;
}

@DataEntity({ tableName: 'Artist' })
class OrmArtist {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

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

@Entity('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true })
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id })
	artist!: Artist;
}

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

const graphweaver = new Graphweaver();

test('should correctly aggregate root User queries with no filter', async () => {
	const response = await graphweaver.server.executeOperation({
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

test('should correctly aggregate root User queries with a filter', async () => {
	const response = await graphweaver.server.executeOperation({
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
