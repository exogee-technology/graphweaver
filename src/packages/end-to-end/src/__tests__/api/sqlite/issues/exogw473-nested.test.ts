import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	Ref,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

/** Setup MikroORM entities */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'string' })
	albumId!: string;

	@Property({ fieldName: 'Title', type: 'string' })
	title!: string;

	@ManyToOne({
		entity: () => OrmArtist,
		ref: true,
		fieldName: 'ArtistId',
		nullable: true,
	})
	artist?: Ref<OrmArtist>;
}

@DataEntity({ tableName: 'Artist' })
class OrmArtist {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'string' })
	artistId!: string;

	@Property({ fieldName: 'Name', type: 'string', nullable: true })
	name?: string;

	@OneToMany({ entity: () => OrmAlbum, mappedBy: 'artist' })
	albums = new Collection<OrmAlbum>(this);
}

const connection = {
	connectionManagerId: 'exogw473-nested-test',
	mikroOrmConfig: {
		entities: [OrmAlbum, OrmArtist],
		driver: SqliteDriver,
		dbName: ':memory:',
	},
};

/** Setup Graphweaver entities with clientGeneratedPrimaryKeys */
@Entity<Album>('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class Album {
	@Field(() => ID, { primaryKeyField: true })
	albumId!: string;

	@Field(() => String)
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.artistId })
	artist!: Artist;
}

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class Artist {
	@Field(() => ID, { primaryKeyField: true })
	artistId!: string;

	@Field(() => String, { nullable: true })
	name?: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}

type ArtistResult = {
	artistId: string;
	name: string;
	albums: {
		albumId: string;
		title: string;
	}[];
};

const graphweaver = new Graphweaver();
let em: EntityManager | undefined = undefined;

beforeAll(async () => {
	const connectionResult = await ConnectionManager.connect('exogw473-nested-test', connection);
	em = connectionResult?.em;
	assert(em !== undefined);
	await em
		.getConnection()
		.execute('CREATE TABLE Artist (ArtistId TEXT PRIMARY KEY, Name TEXT)');
	await em
		.getConnection()
		.execute('CREATE TABLE Album (AlbumId TEXT PRIMARY KEY, Title TEXT, ArtistId TEXT)');
});

afterAll(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DROP TABLE Album');
	await em.getConnection().execute('DROP TABLE Artist');
	await em.getConnection().close();
});

beforeEach(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DELETE FROM Album');
	await em.getConnection().execute('DELETE FROM Artist');
});

describe('Create nested Entities with clientGeneratedPrimaryKeys', () => {
	test('should create an artist and an album', async () => {
		const response = await graphweaver.executeOperation<{ createArtist: ArtistResult }>({
			query: gql`
				mutation CreateArtist($input: ArtistInsertInput!) {
					createArtist(input: $input) {
						artistId
						name
						albums {
							albumId
							title
						}
					}
				}
			`,
			variables: {
				input: {
					artistId: 'artist-1',
					name: 'Test Artist',
					albums: [
						{ albumId: 'album-1', title: 'Test Album' },
						{ albumId: 'album-2', title: 'Test Album 2' },
					],
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data?.createArtist?.artistId).toBe('artist-1');
		expect(response.body.singleResult.data?.createArtist?.name).toBe('Test Artist');
		expect(response.body.singleResult.data?.createArtist?.albums?.[0]?.albumId).toBe('album-1');
		expect(response.body.singleResult.data?.createArtist?.albums?.[0]?.title).toBe('Test Album');
		expect(response.body.singleResult.data?.createArtist?.albums?.[1]?.albumId).toBe('album-2');
		expect(response.body.singleResult.data?.createArtist?.albums?.[1]?.title).toBe('Test Album 2');
	});
});
