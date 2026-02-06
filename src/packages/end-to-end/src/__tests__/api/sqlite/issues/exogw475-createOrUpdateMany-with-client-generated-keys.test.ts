import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import {
	Field,
	ID,
	Entity,
	EntityMetadata,
	fromBackendEntity,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

@DataEntity({ tableName: 'user' })
class OrmUser {
	@PrimaryKey({ type: 'number', autoincrement: true })
	customPrimaryKeyField!: number;

	@Property({ type: 'string' })
	username!: string;

	@Property({ type: 'string' })
	email!: string;
}

const connection = {
	connectionManagerId: 'exogw473',
	mikroOrmConfig: {
		entities: [OrmUser],
		driver: SqliteDriver,
		dbName: ':memory:',
	},
};

@Entity<User>('User', {
	provider: new MikroBackendProvider(OrmUser, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class User {
	@Field(() => ID, { primaryKeyField: true })
	customPrimaryKeyField!: string;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;
}

graphweaverMetadata.addMutation({
	name: 'exampleCreateMutation',
	getType: () => [User],
	resolver: async () => {
		const userEntity = graphweaverMetadata.getEntityByName(
			'User'
		) as EntityMetadata<User, OrmUser>;

		const users = await userEntity.provider!.createOrUpdateMany([
			{customPrimaryKeyField: 100, username: 'example_mutation', email: 'example@test.com'} as unknown as Partial<OrmUser>,
			{username: 'example_mutation_2', email: 'example2@test.com'} as unknown as Partial<OrmUser>,
		]);

		return users.map(user =>
			fromBackendEntity(userEntity, user)
		);
	},
});

graphweaverMetadata.addMutation({
	name: 'exampleUpdateMutation',
	getType: () => [User],
	resolver: async () => {
		const userEntity = graphweaverMetadata.getEntityByName(
			'User'
		) as EntityMetadata<User, OrmUser>;

		const users = await userEntity.provider!.createOrUpdateMany([
			{customPrimaryKeyField: 100, username: 'updated_mutation', email: 'updated@test.com'} as unknown as Partial<OrmUser>,
		]);

		return users.map(user =>
			fromBackendEntity(userEntity, user)
		);
	},
});

type UserResult = {
	customPrimaryKeyField: string;
	username: string;
	email: string;
};

const graphweaver = new Graphweaver();
let em: EntityManager | undefined = undefined;

beforeAll(async () => {
	const connectionResult = await ConnectionManager.connect('exogw473', connection);
	em = connectionResult?.em;
	assert(em !== undefined);
	await em
		.getConnection()
		.execute('CREATE TABLE user (custom_primary_key_field INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT)');
});

afterAll(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DROP TABLE user');
	await em.getConnection().close();
});

beforeEach(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DELETE FROM user');
});

describe('EXOGW-475 - Create many entities with clientGeneratedPrimaryKeys via provider.createOrUpdateMany', () => {
	test('should create multiple users via custom mutation using provider.createOrUpdateMany', async () => {
		const response = await graphweaver.executeOperation<{
			exampleCreateMutation: UserResult[];
		}>({
			query: gql`
				mutation {
					exampleCreateMutation {
						customPrimaryKeyField
						username
						email
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data?.exampleCreateMutation).toHaveLength(2);
		expect(response.body.singleResult.data?.exampleCreateMutation[0]).toMatchObject({
			customPrimaryKeyField: '100',
			username: 'example_mutation',
			email: 'example@test.com',
		});
		expect(response.body.singleResult.data?.exampleCreateMutation[1]).toMatchObject({
			customPrimaryKeyField: expect.any(String),
			username: 'example_mutation_2',
			email: 'example2@test.com',
		});
	});

	test('should update existing users via createOrUpdateMany when entities already exist', async () => {
		// First, create the users
		const createResponse = await graphweaver.executeOperation<{
			exampleCreateMutation: UserResult[];
		}>({
			query: gql`
				mutation {
					exampleCreateMutation {
						customPrimaryKeyField
						username
						email
					}
				}
			`,
		});

		assert(createResponse.body.kind === 'single');
		expect(createResponse.body.singleResult.errors).toBeUndefined();

		// Now, update them via createOrUpdateMany (same PKs, different data)
		const updateResponse = await graphweaver.executeOperation<{
			exampleUpdateMutation: UserResult[];
		}>({
			query: gql`
				mutation {
					exampleUpdateMutation {
						customPrimaryKeyField
						username
						email
					}
				}
			`,
		});

		assert(updateResponse.body.kind === 'single');
		expect(updateResponse.body.singleResult.errors).toBeUndefined();
		expect(updateResponse.body.singleResult.data?.exampleUpdateMutation).toHaveLength(1);
		expect(updateResponse.body.singleResult.data?.exampleUpdateMutation[0]).toMatchObject({
			customPrimaryKeyField: '100',
			username: 'updated_mutation',
			email: 'updated@test.com',
		});
	});
});
