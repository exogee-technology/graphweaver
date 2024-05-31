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
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { resetDatabase } from '../../../../utils';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
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

	@RelationshipField<OrmAlbum>(() => Artist, {
		id: (entity) => entity.artist?.id,
	})
	renamed_artist!: Artist;
}

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'renamed_artist' })
	renamed_albums!: Album[];
}

describe('RelationshipField', () => {
	beforeEach(resetDatabase);

	test('should not get error on buildSchema when relationship field name is not same as entity', async () => {
		const graphweaver = new Graphweaver();

		const response = await graphweaver.server.executeOperation({
			query: gql`
				query {
					albums {
						id
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.albums).toHaveLength(347);
	});
});
