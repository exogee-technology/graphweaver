import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity as DataEntity, Property, PrimaryKey } from '@mikro-orm/core';
import { Field, ID, Entity } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { resetDatabase } from '../../../../utils';

import { SqliteDriver } from '@mikro-orm/sqlite';

/** Setup entities and resolvers  */
@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Title', type: 'string' })
	title!: string;
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmAlbum],
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

	@Field(() => String)
	title!: string;
}

describe('Top level and/or/not', () => {
	beforeEach(resetDatabase);

	test('should correctly emit _and/_or/_not', async () => {
		const graphweaver = new Graphweaver();
		await ConnectionManager.connect('sqlite', connection);

		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					albums(filter: { _and: [{ id: 5 }, { id: 6 }] }) {
						id
						title
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBe(undefined);
		expect(response.body.singleResult.data?.albums).toHaveLength(0);

		const response2 = await graphweaver.executeOperation({
			query: gql`
				query {
					albums(filter: { _or: [{ id: 5 }, { id: 6 }] }) {
						id
						title
					}
				}
			`,
		});
		assert(response2.body.kind === 'single');
		expect(response2.body.singleResult.errors).toBe(undefined);
		expect(response2.body.singleResult.data?.albums).toHaveLength(2);

		const response3 = await graphweaver.executeOperation({
			query: gql`
				query {
					albums_aggregate {
						count
					}
				}
			`,
		});
		assert(response3.body.kind === 'single');
		expect(response3.body.singleResult.errors).toBe(undefined);
		const totalCount: number = (response3.body.singleResult.data?.albums_aggregate as any).count;

		const response4 = await graphweaver.executeOperation({
			query: gql`
				query {
					albums_aggregate(filter: { _not: { id: "5" } }) {
						count
					}
				}
			`,
		});
		assert(response4.body.kind === 'single');
		expect(response4.body.singleResult.errors).toBe(undefined);
		expect((response4.body.singleResult.data?.albums_aggregate as any).count).toBe(totalCount - 1);
	});
});
