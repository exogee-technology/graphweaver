import 'reflect-metadata';
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
} from '@mikro-orm/core';
import { Field, GraphQLEntity, GraphQLID, Entity, RelationshipField } from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { resetDatabase } from '../../../../utils';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum extends BaseEntity {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@ManyToOne({
		entity: () => OrmArtist,
		ref: true,
		fieldName: 'ArtistId',
		index: 'IFK_AlbumArtistId',
	})
	artist!: Ref<OrmArtist>;
}

@DataEntity({ tableName: 'Artist' })
class OrmArtist extends BaseEntity {
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

@Entity('TestAlbum', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => GraphQLID)
	id!: number;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id })
	renamedArtist!: Artist;
}

@Entity('TestArtist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist extends GraphQLEntity<OrmArtist> {
	public dataEntity!: OrmArtist;

	@Field(() => GraphQLID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	renamedAlbums!: Album[];
}

describe('RelationshipField', () => {
	beforeEach(resetDatabase);

	test('should not get error on buildSchema when object type name is not same as entity', async () => {
		const graphweaver = new Graphweaver();

		const response = await graphweaver.server.executeOperation({
			query: gql`
				query {
					testAlbums {
						id
						renamedArtist {
							id
						}
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		console.log(response.body.singleResult.data);
		expect(response.body.singleResult.data?.testAlbums).toHaveLength(347);
	});
});
