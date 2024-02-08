import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	ArrayType,
	Entity,
	Collection,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import {
	createBaseResolver,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	Resolver,
} from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Schema } from '@exogee/graphweaver-admin-ui-components';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@Entity({ tableName: 'Album' })
class OrmAlbum extends BaseEntity {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ type: ArrayType, default: [] })
	title!: string[];

	@ManyToOne({
		entity: () => OrmArtist,
		wrappedReference: true,
		fieldName: 'ArtistId',
		index: 'IFK_AlbumArtistId',
	})
	artist!: OrmArtist;
}

@Entity({ tableName: 'Artist' })
class OrmArtist extends BaseEntity {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

	@OneToMany({ entity: () => OrmAlbum, mappedBy: 'artist' })
	albums = new Collection<OrmAlbum>(this);
}

@ObjectType('Album')
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => ID)
	id!: number;

	@Field(() => [String], { nullable: true })
	title?: string[];

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id })
	artist!: Artist;
}

@ObjectType('Artist')
export class Artist extends GraphQLEntity<OrmArtist> {
	public dataEntity!: OrmArtist;

	@Field(() => ID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmAlbum, OrmArtist],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, OrmAlbum>(
	Album,
	new MikroBackendProvider(OrmAlbum, connection)
) {}

@Resolver((of) => Artist)
class ArtistResolver extends createBaseResolver<Artist, OrmArtist>(
	Artist,
	new MikroBackendProvider(OrmArtist, connection)
) {}

test('Should return isArray = true if field property is defined as array', async () => {
	const graphweaver = new Graphweaver({
		resolvers: [AlbumResolver, ArtistResolver],
	});

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
