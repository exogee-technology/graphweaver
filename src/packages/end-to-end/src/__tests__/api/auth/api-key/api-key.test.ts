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
	authApolloPlugin,
	UserProfile,
	createApiKeyResolver,
	ApiKey,
	ApiKeyStorage,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider, BaseEntity, ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { ArrayType, BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

// Create Entity
@Entity({ tableName: 'api_key' })
class OrmApiKey extends BaseEntity implements ApiKeyStorage {
	@PrimaryKey({ type: BigIntType })
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
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
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
const dataProvider = new MikroBackendProvider(OrmApiKey, connection);

@Resolver()
export class ApiKeyAuthResolver extends createApiKeyResolver<OrmApiKey>(ApiKey, dataProvider) {}

@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

@Resolver((of) => Task)
class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, connection)
) {}

const graphweaver = new Graphweaver({
	resolvers: [ApiKeyAuthResolver, TaskResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => ({} as UserProfile), dataProvider)],
	},
});

describe('API Key Authentication', () => {
	beforeAll(async () => {
		await ConnectionManager.connect('InMemory', connection);
		const database = ConnectionManager.database('InMemory');
		await database?.orm.schema.createSchema();
	});

	test('should return an error when no system user is found.', async () => {
		const base64EncodedCredentials = Buffer.from('testf:test').toString('base64');
		console.log(base64EncodedCredentials);

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
});
