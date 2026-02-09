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
} from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

@DataEntity({ tableName: 'tag' })
class OrmTag {
	@PrimaryKey({ type: 'number', autoincrement: true, fieldName: 'tag_id' })
	tagId!: number;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({
		entity: () => OrmTask,
		owner: true,
		pivotTable: 'task_tag',
		joinColumn: 'tag_id',
		inverseJoinColumn: 'task_id',
	})
	tasks = new Collection<OrmTask>(this);
}

@DataEntity({ tableName: 'task' })
class OrmTask {
	@PrimaryKey({ type: 'number', autoincrement: true, fieldName: 'task_id' })
	taskId!: number;

	@ManyToOne({ entity: () => OrmUser, ref: true, nullable: true, fieldName: 'user_id' })
	user?: Ref<OrmUser>;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({
		entity: () => OrmTag,
		pivotTable: 'task_tag',
		joinColumn: 'task_id',
		inverseJoinColumn: 'tag_id',
		mappedBy: 'tasks',
	})
	tags = new Collection<OrmTag>(this);
}

@DataEntity({ tableName: 'user' })
class OrmUser {
	@PrimaryKey({ type: 'number', autoincrement: true, fieldName: 'user_id' })
	userId!: number;

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
	tagId!: number;

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
	taskId!: number;

	@RelationshipField<Task>(() => User, { id: (entity) => entity.user?.userId, nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks'})
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
	userId!: number;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'user' })
	tasks!: Task[];
}

type UserResult = {
	userId: number;
	username: string;
	email: string;
	tasks: {
		taskId: number;
		description: string;
		tags: {
			tagId: number;
			description: string;
		}[];
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
		.execute(
			'CREATE TABLE user (user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT)'
		);
	await em
		.getConnection()
		.execute(
			'CREATE TABLE task (task_id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, user_id INTEGER)'
		);
	await em
		.getConnection()
		.execute('CREATE TABLE tag (tag_id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT)');
	await em
		.getConnection()
		.execute(
			'CREATE TABLE task_tag (task_id INTEGER, tag_id INTEGER, PRIMARY KEY (task_id, tag_id))'
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

describe('EXOGW-474 - Array values in nested entities', () => {
	test('should create a user with nested tasks and tags without error', async () => {
		const response = await graphweaver.executeOperation<{
			createUser: UserResult;
		}>({
			query: gql`
				mutation createUser($input: UserInsertInput!) {
					createUser(input: $input) {
						userId
						email
						username
						tasks {
							taskId
							description
							tags {
								tagId
								description
							}
						}
					}
				}
			`,
			variables: {
				input: {
					userId: 2,
					username: 'example_create',
					email: 'example@email.com',
					tasks: [
						{
							taskId: 3,
							description: 'Walk the dog',
						},
						{
							taskId: 4,
							description: 'Make dinner',
							tags: [
								{
									tagId: 1,
									description: 'URGENT',
								},
								{
									tagId: 2,
									description: 'YUM',
								},
							],
						},
					],
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data?.createUser?.userId).toBe('2');
		expect(response.body.singleResult.data?.createUser?.username).toBe('example_create');
		expect(response.body.singleResult.data?.createUser?.email).toBe('example@email.com');
		expect(response.body.singleResult.data?.createUser?.tasks).toHaveLength(2);
		expect(response.body.singleResult.data?.createUser?.tasks?.[0]?.taskId).toBe('3');
		expect(response.body.singleResult.data?.createUser?.tasks?.[0]?.description).toBe('Walk the dog');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.taskId).toBe('4');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.description).toBe('Make dinner');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.tags).toHaveLength(2);
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.tags?.[0]?.tagId).toBe('1');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.tags?.[0]?.description).toBe('URGENT');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.tags?.[1]?.tagId).toBe('2');
		expect(response.body.singleResult.data?.createUser?.tasks?.[1]?.tags?.[1]?.description).toBe('YUM');

		// Get Tasks with Tags
		const taskResponse = await graphweaver.executeOperation<{
			tasks: {
				taskId: number;
				description: string;
				tags: {
					tagId: number;
					description: string;
				}[];
			}[];
		}>({
			query: gql`
				query {
					tasks {
						taskId
						description
						tags {
							tagId
							description
						}
					}
				}
			`,
		});

		assert(taskResponse.body.kind === 'single');
		expect(taskResponse.body.singleResult.errors).toBeUndefined();
		const tasks = taskResponse.body.singleResult.data?.tasks;
		expect(tasks).toHaveLength(2);

		const walkTheDog = tasks?.find((t) => t.description === 'Walk the dog');
		expect(walkTheDog).toBeDefined();
		expect(walkTheDog?.tags).toHaveLength(0);

		const makeDinner = tasks?.find((t) => t.description === 'Make dinner');
		expect(makeDinner).toBeDefined();
		expect(makeDinner?.tags).toHaveLength(2);
		expect(makeDinner?.tags?.find((t) => t.description === 'URGENT')).toBeDefined();
		expect(makeDinner?.tags?.find((t) => t.description === 'YUM')).toBeDefined();

		// Get all Tags with Tasks
		const tagsResponse = await graphweaver.executeOperation<{
			tags: {
				tagId: number;
				description: string;
				tasks: {
					taskId: number;
					description: string;
				}[];
			}[];
		}>({
			query: gql`
				query {
					tags {
						tagId
						description
						tasks {
							taskId
							description
						}
					}
				}
			`,
		});

		assert(tagsResponse.body.kind === 'single');
		expect(tagsResponse.body.singleResult.errors).toBeUndefined();
		const tags = tagsResponse.body.singleResult.data?.tags;
		expect(tags).toHaveLength(2);

		for (const tag of tags ?? []) {
			expect(tag.tasks).toHaveLength(1);
			expect(tag.tasks[0].description).toBe('Make dinner');
		}
	});
});
