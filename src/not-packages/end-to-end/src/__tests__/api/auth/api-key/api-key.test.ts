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
import { authApolloPlugin, UserProfile, ApiKeyStorage } from '@exogee/graphweaver-auth';
import { MikroBackendProvider, BaseEntity, ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { ArrayType, BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

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

	@Property({ type: ArrayType, default: [] })
	roles!: string[];
}

@Entity()
export class OrmTask extends BaseEntity {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	description!: string;
}

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
		plugins: [
			authApolloPlugin(async () => ({}) as UserProfile, {
				apiKeyDataProvider,
				implicitAllow: true,
			}),
		],
	},
});

describe('API Key Authentication', () => {
	beforeAll(async () => {
		await ConnectionManager.connect('InMemory', connection);
		const database = ConnectionManager.database('InMemory');
		await database?.orm.schema.createSchema();

		// Standard working test API Key
		const testApiKey = database?.em.create(OrmApiKey, {
			key: 'test',
			secret:
				'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
			revoked: false,
			roles: ['admin'],
		});
		if (testApiKey) database?.em.persistAndFlush(testApiKey);

		// Revoked test API Key
		const testRevokedApiKey = database?.em.create(OrmApiKey, {
			key: 'test_revoked',
			secret:
				'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
			revoked: true,
			roles: ['admin'],
		});
		if (testRevokedApiKey) database?.em.persistAndFlush(testRevokedApiKey);
	});

	test('should return a E0001 error when no system user is found.', async () => {
		const base64EncodedCredentials = Buffer.from('test_fail:test').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				query {
					tasks {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeDefined();
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Bad Request: API Key Authentication Failed. (E0001)'
		);
	});

	test('should return a E0002 error when API Key has been revoked.', async () => {
		const base64EncodedCredentials = Buffer.from('test_revoked:test').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				query {
					tasks {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeDefined();
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Bad Request: API Key Authentication Failed. (E0002)'
		);
	});

	test('should return a E0003 error when password does not match.', async () => {
		const base64EncodedCredentials = Buffer.from('test:test_fail').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				query {
					tasks {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeDefined();
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Bad Request: API Key Authentication Failed. (E0003)'
		);
	});

	test('should return data when using a valid system user.', async () => {
		const base64EncodedCredentials = Buffer.from('test:test').toString('base64');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ ['x-api-key']: base64EncodedCredentials }) } as any,
			query: gql`
				query {
					tasks {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
	});
});
