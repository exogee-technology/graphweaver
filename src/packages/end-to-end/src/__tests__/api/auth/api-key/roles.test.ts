process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	Resolver,
	createBaseResolver,
} from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
	authApolloPlugin,
	UserProfile,
	ApiKeyStorage,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider, BaseEntity, ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { BigIntType, Enum, EnumArrayType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

// Create Entity
@Entity({ tableName: 'api_key' })
class OrmApiKey extends BaseEntity implements ApiKeyStorage {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String, fieldName: 'api_key' })
	key!: string;

	@Property({ type: String })
	secret!: string;

	@Property({ type: Boolean })
	revoked!: boolean;

	@Enum({ type: EnumArrayType, items: () => Roles, array: true, default: [] })
	roles!: Roles[];
}

@Entity()
export class OrmTask extends BaseEntity {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	description!: string;
}

const acl: AccessControlList<Task, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only read tags
		read: true,
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
};
@ApplyAccessControlList(acl)
@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

// Create Data Provider
const connection = {
	connectionManagerId: 'InMemory',
	mikroOrmConfig: {
		entities: [OrmApiKey, OrmTask],
		dbName: ':memory:',
		driver: SqliteDriver,
	},
};

@Resolver((of) => Task)
class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, connection)
) {}

const apiKeyDataProvider = new MikroBackendProvider(OrmApiKey, connection);

const graphweaver = new Graphweaver({
	resolvers: [TaskResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => ({} as UserProfile), { apiKeyDataProvider })],
	},
});

describe('Role Assignment for API Key Authentication', () => {
	beforeAll(async () => {
		await ConnectionManager.connect('InMemory', connection);
		const database = ConnectionManager.database('InMemory');
		await database?.orm.schema.createSchema();

		// Standard working test API Key
		const testLightSideApiKey = database?.em.create(OrmApiKey, {
			key: 'test_lightside',
			secret:
				'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
			revoked: false,
			roles: [Roles.LIGHT_SIDE],
		});
		if (testLightSideApiKey) database?.em.persistAndFlush(testLightSideApiKey);

		const testDarkSideApiKey = database?.em.create(OrmApiKey, {
			key: 'test_darkside',
			secret:
				'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
			revoked: false,
			roles: [Roles.DARK_SIDE],
		});
		if (testDarkSideApiKey) database?.em.persistAndFlush(testDarkSideApiKey);
	});

	test('should create task successfully when dark side has all permissions.', async () => {
		const base64EncodedCredentials = Buffer.from('test_darkside:test').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				mutation createEntity($data: TaskInsertInput!) {
					createTask(data: $data) {
						id
						description
						__typename
					}
				}
			`,
			variables: { data: { description: 'create dark side entity' } },
		});

		assert(response.body.kind === 'single');

		expect(response.body.singleResult.data?.createTask).toBeDefined();
		expect(response.body.singleResult.errors).toBeUndefined();
	});

	test('should return forbidden error when light side only has read permissions.', async () => {
		const base64EncodedCredentials = Buffer.from('test_lightside:test').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				mutation createEntity($data: TaskInsertInput!) {
					createTask(data: $data) {
						id
						description
						__typename
					}
				}
			`,
			variables: { data: { description: 'create light side entity' } },
		});

		assert(response.body.kind === 'single');

		expect(response.body.singleResult.errors).toBeDefined();
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
