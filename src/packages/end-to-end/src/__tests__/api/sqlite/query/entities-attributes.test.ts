import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
import {
	createBaseResolver,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	Resolver,
	ReadOnly,
	SummaryField,
} from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Schema } from '@exogee/graphweaver-admin-ui-components';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@Entity({ tableName: 'Album' })
class OrmAlbum extends BaseEntity {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
	title!: string;
}

@Entity({ tableName: 'Artist' })
class OrmArtist extends BaseEntity {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;
}

@ReadOnly()
@ObjectType('Album')
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String)
	title!: string;
}

@ObjectType('Artist')
export class Artist extends GraphQLEntity<OrmArtist> {
	public dataEntity!: OrmArtist;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;
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

test('Should return isReadOnly attribute for each entity in getAdminUiMetadata', async () => {
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

	const albumEntity = result.entities.find((entity) => entity.name === 'Album');
	expect(albumEntity).not.toBeNull();
	expect(albumEntity?.attributes.isReadOnly).toEqual(true);

	const artistEntity = result.entities.find((entity) => entity.name === 'Artist');
	expect(artistEntity).not.toBeNull();
	expect(artistEntity?.attributes.isReadOnly).toBeNull();
});
