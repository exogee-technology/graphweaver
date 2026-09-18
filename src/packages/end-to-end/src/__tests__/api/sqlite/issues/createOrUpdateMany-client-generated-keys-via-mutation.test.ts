import { after, before, beforeEach, describe, test } from 'node:test';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity as DataEntity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ID, Entity } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

// This covers the `clientGeneratedPrimaryKeys && createOrUpdateMany` branch in the
// createOrUpdate resolver, which looks the input IDs up via provider.find() to decide
// which items are creates and which are updates. The existing EXOGW-475 test calls
// provider.createOrUpdateMany() directly, so it never reaches the resolver.

@DataEntity({ tableName: 'widget' })
class OrmWidget {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'string' })
	name!: string;
}

const connection = {
	connectionManagerId: 'create-or-update-many-client-keys',
	mikroOrmConfig: {
		entities: [OrmWidget],
		driver: SqliteDriver,
		dbName: ':memory:',
	},
};

@Entity<Widget>('Widget', {
	provider: new MikroBackendProvider(OrmWidget, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
export class Widget {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	name!: string;
}

type WidgetResult = {
	id: string;
	name: string;
};

const CREATE_OR_UPDATE_WIDGETS = gql`
	mutation ($input: [WidgetCreateOrUpdateInput!]!) {
		createOrUpdateWidgets(input: $input) {
			id
			name
		}
	}
`;

const graphweaver = new Graphweaver();
let em: EntityManager | undefined = undefined;

before(async () => {
	const connectionResult = await ConnectionManager.connect(
		connection.connectionManagerId,
		connection
	);
	em = connectionResult?.em;
	assert(em !== undefined);
	await em.getConnection().execute('CREATE TABLE widget (id TEXT PRIMARY KEY, name TEXT)');
});

after(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DROP TABLE widget');
	await em.getConnection().close();
});

beforeEach(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DELETE FROM widget');
	await em.getConnection().execute("INSERT INTO widget (id, name) VALUES ('existing', 'before')");
});

describe('createOrUpdateMany with clientGeneratedPrimaryKeys via the GraphQL mutation', () => {
	test('should update the entity that already exists and create the one that does not', async () => {
		const response = await graphweaver.executeOperation<{
			createOrUpdateWidgets: WidgetResult[];
		}>({
			query: CREATE_OR_UPDATE_WIDGETS,
			variables: {
				input: [
					{ id: 'existing', name: 'after' },
					{ id: 'brand-new', name: 'created' },
				],
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const widgets = response.body.singleResult.data?.createOrUpdateWidgets;
		expect(widgets).toHaveLength(2);
		expect(widgets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'existing', name: 'after' }),
				expect.objectContaining({ id: 'brand-new', name: 'created' }),
			])
		);

		// The pre-existing row must have been updated in place, not duplicated or left alone.
		assert(em !== undefined);
		const rows = await em.getConnection().execute('SELECT id, name FROM widget ORDER BY id');
		expect(rows).toEqual([
			{ id: 'brand-new', name: 'created' },
			{ id: 'existing', name: 'after' },
		]);
	});
});
