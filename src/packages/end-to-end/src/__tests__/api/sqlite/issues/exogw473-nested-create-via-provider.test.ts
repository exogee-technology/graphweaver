import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	Ref,
	ManyToOne,
	ManyToMany,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import {
	Field,
	ID,
	Entity,
	RelationshipField,
	EntityMetadata,
	fromBackendEntity,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

@DataEntity({ tableName: 'tag' })
class OrmTag {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({
		entity: () => OrmTask,
		pivotTable: 'task_tag',
		joinColumn: 'tag_id',
		inverseJoinColumn: 'task_id',
	})
	tasks = new Collection<OrmTask>(this);
}

@DataEntity({ tableName: 'task' })
class OrmTask {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@ManyToOne({ entity: () => OrmUser, ref: true, nullable: true })
	user?: Ref<OrmUser>;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({
		entity: () => OrmTag,
		pivotTable: 'task_tag',
		joinColumn: 'task_id',
		inverseJoinColumn: 'tag_id',
	})
	tags = new Collection<OrmTag>(this);
}

@DataEntity({ tableName: 'user' })
class OrmUser {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'string' })
	username!: string;

	@Property({ type: 'string' })
	email!: string;

	@OneToMany({ entity: () => OrmTask, mappedBy: 'user' })
	tasks = new Collection<OrmTask>(this);
}

const connection = {
	connectionManagerId: 'exogw473',
	mikroOrmConfig: {
		entities: [OrmTag, OrmTask, OrmUser],
		driver: SqliteDriver,
		dbName: ':memory:',
	},
};

@Entity<Tag>('Tag', {
	provider: new MikroBackendProvider(OrmTag, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class Tag {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}

@Entity<Task>('Task', {
	provider: new MikroBackendProvider(OrmTask, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class Task {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField<Task>(() => User, { id: (entity) => entity.user?.id, nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];
}

@Entity<User>('User', {
	provider: new MikroBackendProvider(OrmUser, connection),
	apiOptions: {
		clientGeneratedPrimaryKeys: true,
	},
})
class User {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'user' })
	tasks!: Task[];
}

graphweaverMetadata.addMutation({
	name: 'exampleMutation',
	getType: () => User,
	resolver: async () => {
		const userEntity = graphweaverMetadata.getEntityByName(
			'User'
		) as EntityMetadata<User, OrmUser>;

		const user = await userEntity.provider!.createOne({
			id: '1',
			username: 'example_mutation',
			email: 'example@test.com',
			tasks: [
				{
					id: '1',
					description: 'Wash your face with orange juice',
				},
				{
					id: '2',
					description: 'Clean your teeth with bubblegum',
				},
			],
		} as unknown as Partial<OrmUser>);
		return fromBackendEntity(userEntity, user);
	},
});

type UserResult = {
	id: string;
	username: string;
	email: string;
	tasks: {
		id: string;
		description: string;
	}[];
};

const graphweaver = new Graphweaver();
let em: EntityManager | undefined = undefined;

beforeAll(async () => {
	const connectionResult = await ConnectionManager.connect('exogw473', connection);
	em = connectionResult?.em;
	assert(em !== undefined);
	await em
		.getConnection()
		.execute('CREATE TABLE user (id TEXT PRIMARY KEY, username TEXT, email TEXT)');
	await em
		.getConnection()
		.execute('CREATE TABLE task (id TEXT PRIMARY KEY, description TEXT, user_id TEXT)');
	await em
		.getConnection()
		.execute('CREATE TABLE tag (id TEXT PRIMARY KEY, description TEXT)');
	await em
		.getConnection()
		.execute(
			'CREATE TABLE task_tag (task_id TEXT, tag_id TEXT, PRIMARY KEY (task_id, tag_id))'
		);
});

afterAll(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DROP TABLE task_tag');
	await em.getConnection().execute('DROP TABLE tag');
	await em.getConnection().execute('DROP TABLE task');
	await em.getConnection().execute('DROP TABLE user');
	await em.getConnection().close();
});

beforeEach(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DELETE FROM task_tag');
	await em.getConnection().execute('DELETE FROM tag');
	await em.getConnection().execute('DELETE FROM task');
	await em.getConnection().execute('DELETE FROM user');
});

describe('EXOGW-473 - Create nested entities with clientGeneratedPrimaryKeys via provider.createOne', () => {
	test('should create a user with nested tasks via custom mutation using provider.createOne', async () => {
		const response = await graphweaver.executeOperation<{
			exampleMutation: UserResult;
		}>({
			query: gql`
				mutation {
					exampleMutation {
						id
						username
						email
						tasks {
							id
							description
						}
					}
				}
			`,
		});

		console.log(JSON.stringify(response.body, null, 2));

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data?.exampleMutation?.id).toBe('1');
		expect(response.body.singleResult.data?.exampleMutation?.username).toBe('example_mutation');
		expect(response.body.singleResult.data?.exampleMutation?.email).toBe('example@test.com');
		expect(response.body.singleResult.data?.exampleMutation?.tasks).toHaveLength(2);
		expect(response.body.singleResult.data?.exampleMutation?.tasks?.[0]?.id).toBe('1');
		expect(response.body.singleResult.data?.exampleMutation?.tasks?.[0]?.description).toBe(
			'Wash your face with orange juice'
		);
		expect(response.body.singleResult.data?.exampleMutation?.tasks?.[1]?.id).toBe('2');
		expect(response.body.singleResult.data?.exampleMutation?.tasks?.[1]?.description).toBe(
			'Clean your teeth with bubblegum'
		);
	});
});
