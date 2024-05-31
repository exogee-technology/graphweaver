import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity as DataEntity, Property, PrimaryKey } from '@mikro-orm/core';
import { Field, ID, Entity, AdminUiEntityMetadata } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
	title!: string;
}

@DataEntity({ tableName: 'Artist' })
class OrmArtist {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
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

@Entity('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
	adminUIOptions: {
		readonly: true,
	},
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	title!: string;
}

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true })
	name?: string;
}

test('Should return isReadOnly attribute for each entity in getAdminUiMetadata', async () => {
	const graphweaver = new Graphweaver();

	const response = await graphweaver.server.executeOperation<{
		result: {
			entities: AdminUiEntityMetadata[];
		};
	}>({
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
	const result = response.body.singleResult.data?.result;
	expect(result?.entities).toHaveLength(2);

	const albumEntity = result?.entities.find((entity) => entity.name === 'Album');
	expect(albumEntity).not.toBeNull();
	expect(albumEntity?.attributes?.isReadOnly).toEqual(true);

	const artistEntity = result?.entities.find((entity) => entity.name === 'Artist');
	expect(artistEntity).not.toBeNull();
	expect(artistEntity?.attributes?.isReadOnly).toBeNull();
});
