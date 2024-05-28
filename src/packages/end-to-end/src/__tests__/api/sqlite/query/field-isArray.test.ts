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
import { Schema } from '@exogee/graphweaver-admin-ui-components';

import { SqliteDriver } from '@mikro-orm/sqlite';

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
	public dataEntity!: OrmAlbum;

	@Field(() => ID)
	id!: number;

	@Field(() => [String], { nullable: true })
	title?: string[];

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id })
	artist!: Artist;
}

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	public dataEntity!: OrmArtist;

	@Field(() => ID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

test('Should return isArray = true if field property is defined as array', async () => {
	const graphweaver = new Graphweaver();

	const response = await graphweaver.server.executeOperation({
		query: gql`
			{
				result: _graphweaver {
					entities {
						name
						backendId
						summaryField
						fields {
							name
							type
							isArray
							relationshipType
							relatedEntity
							filter {
								type
								__typename
							}
							attributes {
								isReadOnly
								__typename
							}
							__typename
						}
						attributes {
							isReadOnly
							__typename
						}
						__typename
					}
					enums {
						name
						values {
							name
							value
							__typename
						}
						__typename
					}
					__typename
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	const result = response.body.singleResult.data?.result as unknown as Schema;
	expect(result.entities).toHaveLength(2);

	const artistEntity = result.entities.find((entity) => entity.name === 'Artist');
	expect(artistEntity).not.toBeNull();

	const artist_albumsField = artistEntity?.fields.find((field) => field.name === 'albums');
	expect(artist_albumsField).not.toBeNull();
	expect(artist_albumsField?.isArray).toEqual(true);

	const albumEntity = result.entities.find((entity) => entity.name === 'Album');
	expect(albumEntity).not.toBeNull();

	const album_titleField = albumEntity?.fields.find((field) => field.name === 'title');
	expect(album_titleField).not.toBeNull();
	expect(album_titleField?.isArray).toEqual(true);
});
