process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.DATABASE = 'sqlite';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	PrimaryKey,
	ManyToMany,
	Property,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField, BaseDataProvider } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';
import {
	ApplyAccessControlList,
	CredentialStorage,
	hashPassword,
	Password,
	setAddUserToContext,
	UserProfile,
} from '@exogee/graphweaver-auth';

@DataEntity({ tableName: 'Tag' })
export class OrmTag {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@ManyToMany(() => OrmTask, (task) => task.tags)
	tasks = new Collection<OrmTask>(this);

	constructor(id?: string) {
		if (id) {
			this.id = id;
		}
	}
}

@DataEntity({ tableName: 'Task' })
export class OrmTask {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'string' })
	userId!: string;

	@ManyToMany(() => OrmTag, (tag) => tag.tasks, { owner: true })
	tags: Collection<OrmTask> = new Collection<OrmTask>(this);

	constructor(id?: string, userId?: string) {
		if (id) {
			this.id = id;
		}
		if (userId) {
			this.userId = userId;
		}
	}
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmTag, OrmTask],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

@ApplyAccessControlList({
	Everyone: { all: (context) => ({ userId: context.user?.id }) },
})
@Entity('Task', {
	provider: new MikroBackendProvider(OrmTask, connection),
})
export class Task {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	userId!: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];
}

@ApplyAccessControlList({
	Everyone: { all: true },
})
@Entity('Tag', {
	provider: new MikroBackendProvider(OrmTag, connection),
})
export class Tag {
	@Field(() => ID)
	id!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags', nullable: true })
	tasks?: Task[];
}

const user = new UserProfile({
	id: '1',
	displayName: 'Test User',
	roles: ['not an admin'],
});

const cred: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		cred.password = await hashPassword(cred.password ?? '');
		return cred;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async () => user,
});

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

let token: string | undefined;
let em: EntityManager | undefined = undefined;

describe.only('Nested entity queries should not bypass row-level security', () => {
	beforeAll(async () => {
		const connectionResult = await ConnectionManager.connect('sqlite', connection);
		em = connectionResult?.em;
		assert(em !== undefined);

		// If tables exists then fail, we are assuming that the tables do not exist
		const tables = await em
			?.getConnection()
			.execute('SELECT name FROM sqlite_master WHERE type="table"');
		const tableNames = tables.map((table: any) => table.name);

		if (
			tableNames.includes('Task') ||
			tableNames.includes('Tag') ||
			tableNames.includes('task_tags')
		) {
			throw new Error(
				'Tables already exist, this test suit assumes that the tables do not exist, the suit throws away the tables at the end of the test'
			);
		}

		// create the task, tag, and task_tags tables
		await em
			.getConnection()
			.execute(
				'CREATE TABLE `Task` (`id` TEXT NOT NULL, `user_id` TEXT NOT NULL, PRIMARY KEY (`id`))'
			);
		await em.getConnection().execute('CREATE TABLE `Tag` (`id` TEXT NOT NULL, PRIMARY KEY (`id`))');
		await em
			.getConnection()
			.execute(
				'CREATE TABLE `task_tags` (`orm_task_id` TEXT NOT NULL, `orm_tag_id` TEXT NOT NULL, PRIMARY KEY (`orm_task_id`, `orm_tag_id`))'
			);

		const loginResponse = await graphweaver.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation loginPassword($username: String!, $password: String!) {
					loginPassword(username: $username, password: $password) {
						authToken
					}
				}
			`,
			variables: {
				username: 'test',
				password: 'test123',
			},
		});

		assert(loginResponse.body.kind === 'single');
		expect(loginResponse.body.singleResult.errors).toBeUndefined();

		token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		expect(token).toContain('Bearer ');
	});

	afterAll(async () => {
		// delete the task, tag, and task_tags tables
		await em?.getConnection().execute('DROP `Task`');
		await em?.getConnection().execute('DROP `Tag`');
		await em?.getConnection().execute('DROP `task_tags`');

		await em?.getConnection().close();
	});

	test.only('Should only return tasks that the user has access to when asking for tags', async () => {
		// create 3 tasks for our user and another 3 for a different user
		const task1ForAuthenticatedUser = new OrmTask('task1ForAuthenticatedUser', user.id);
		const task2ForAuthenticatedUser = new OrmTask('task2ForAuthenticatedUser', user.id);
		const task3ForAuthenticatedUser = new OrmTask('task3ForAuthenticatedUser', user.id);
		const task1ForOtherUser = new OrmTask('task1ForOtherUser', 'another user');
		const task2ForOtherUser = new OrmTask('task2ForOtherUser', 'another user');
		const task3ForOtherUser = new OrmTask('task3ForOtherUser', 'another user');

		// create 3 tags, 1 with a mix of tasks from both users, 1 with tasks from the authenticated user, and 1 with tasks from the other user
		const mixTag = new OrmTag('mixTag');
		mixTag.tasks.add(task1ForAuthenticatedUser);
		mixTag.tasks.add(task2ForOtherUser);
		const tagForAuthenticatedUser = new OrmTag('tagForAuthenticatedUser');
		tagForAuthenticatedUser.tasks.add(task1ForAuthenticatedUser);
		tagForAuthenticatedUser.tasks.add(task2ForAuthenticatedUser);
		tagForAuthenticatedUser.tasks.add(task3ForAuthenticatedUser);
		const tagForOtherUser = new OrmTag('tagForOtherUser');
		tagForOtherUser.tasks.add(task1ForOtherUser);
		tagForOtherUser.tasks.add(task2ForOtherUser);
		tagForOtherUser.tasks.add(task3ForOtherUser);

		await em?.persistAndFlush([
			task1ForAuthenticatedUser,
			task2ForAuthenticatedUser,
			task3ForAuthenticatedUser,
			task1ForOtherUser,
			task2ForOtherUser,
			task3ForOtherUser,
			mixTag,
			tagForAuthenticatedUser,
			tagForOtherUser,
		]);

		const response = await graphweaver.executeOperation({
			http: { headers: new Headers({ authorization: token ?? '' }) } as any,
			query: gql`
				query {
					tags {
						id
						tasks {
							id
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();

		// there should be a tag with id mixTag that has ONE task with id task1ForAuthenticatedUser. The other tasks should not be returned
		// there should also be a tag with id tagForAuthenticatedUser that has THREE tasks with ids task1ForAuthenticatedUser, task2ForAuthenticatedUser, and task3ForAuthenticatedUser
		// there should be a tag with id tagForOtherUser and no tasks
		expect(response.body.singleResult.data?.tags).toHaveLength(3);
		expect(response.body.singleResult.data?.tags).toContainEqual({
			id: 'mixTag',
			tasks: [{ id: 'task1ForAuthenticatedUser' }],
		});
		expect(response.body.singleResult.data?.tags).toContainEqual({
			id: 'tagForAuthenticatedUser',
			tasks: [
				{ id: 'task1ForAuthenticatedUser' },
				{ id: 'task2ForAuthenticatedUser' },
				{ id: 'task3ForAuthenticatedUser' },
			],
		});
	});
});
