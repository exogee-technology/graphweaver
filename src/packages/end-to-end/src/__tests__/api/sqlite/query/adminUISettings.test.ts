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
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField, AdminUiEntityMetadata } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { MediaField, S3StorageProvider } from '@exogee/graphweaver-storage-provider';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
	title!: string;

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

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;

	@OneToMany({ entity: () => OrmAlbum, mappedBy: 'artist' })
	albums = new Collection<OrmAlbum>(this);
}

// Unless we run a local version of s3
// We can't test that we get a signed url back
// We can't test that we get a downwload url back from s3
// This is a mock to test the decorator
const mockS3StorageProvider = {
	getDownloadUrl: (_source: unknown, { key }: { key: string }) =>
		Promise.resolve(`https://example.com/${key}`),
} as S3StorageProvider;

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
	adminUIOptions: {
		hideInSideBar: true,
	},
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	title!: string;

	@RelationshipField<OrmAlbum>(() => Artist, { id: (entity) => entity.artist?.id })
	artist!: Artist;
}

@Entity<Artist>('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
	adminUIOptions: {
		defaultFilter: {
			name: 'test',
		},
	},
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@Field(() => String, {
		nullable: true,
		adminUIOptions: { hideInTable: true, summaryField: true },
	})
	name?: string;

	@RelationshipField(() => [Album], {
		relatedField: 'artist',
		adminUIOptions: {
			hideInFilterBar: true,
		},
	})
	albums!: Album[];

	@MediaField({
		storageProvider: mockS3StorageProvider,
	})
	mediaDownloadUrlField?: string;
}

test('Test the decorator adminUISettings', async () => {
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
						defaultFilter
						summaryField
						hideInSideBar
						fields {
							name
							type
							relationshipType
							relatedEntity
							hideInTable
							hideInFilterBar
							filter {
								type
								__typename
							}
							attributes {
								isReadOnly
								__typename
							}
							extensions {
								key
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
	expect(result?.entities).toHaveLength(12);

	const albumEntity = result?.entities.find((entity) => entity.name === 'Album');
	expect(albumEntity).not.toBeNull();
	expect(albumEntity?.hideInSideBar).toStrictEqual(true);

	const artistEntity = result?.entities.find((entity) => entity.name === 'Artist');
	expect(artistEntity).not.toBeNull();
	expect(artistEntity?.defaultFilter).toStrictEqual({ name: 'test' });
	expect(artistEntity?.summaryField).toStrictEqual('name');

	const idField = artistEntity?.fields?.find((field) => field.name === 'artistId');
	expect(idField).not.toBeNull();
	expect(idField?.filter).not.toBeNull();

	const nameField = artistEntity?.fields?.find((field) => field.name === 'name');
	expect(nameField).not.toBeNull();
	expect(nameField?.hideInTable).toStrictEqual(true);

	const albumsField = artistEntity?.fields?.find((field) => field.name === 'albums');
	expect(albumsField).not.toBeNull();
	expect(albumsField?.hideInFilterBar).toStrictEqual(true);

	// Test that the type of the mediaDownloadUrlField field is Media
	const mediaDownloadUrlField = artistEntity?.fields?.find(
		(field) => field.name === 'mediaDownloadUrlField'
	);

	expect(mediaDownloadUrlField).not.toBeNull();
	expect(mediaDownloadUrlField?.type).toBe('GraphweaverMedia');

	// Test that the field is readonly
	expect(mediaDownloadUrlField?.attributes?.isReadOnly).toBe(true);
});
