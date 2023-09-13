process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.PASSWORD_AUTH_JWT_SECRET = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	Resolver,
	createBaseResolver,
} from '@exogee/graphweaver';
import {
	PasswordAuthResolver,
	passwordAuthApolloPlugin,
	UserProfile,
	ApplyMultiFactorAuthentication,
	AuthProvider,
} from '@exogee/graphweaver-auth';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';

@ApplyMultiFactorAuthentication<Task>({
	Everyone: {
		// all users must provide a password mfa when writing data
		write: [{ factors: 2, providers: [AuthProvider.PASSWORD] }],
	},
})
@ObjectType('Task')
export class Task extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

@Resolver((of) => Task)
class TaskResolver extends createBaseResolver<Task, any>(
	Task,
	new MikroBackendProvider(class OrmTask extends BaseEntity {}, {
		connectionManagerId: 'sqlite',
		mikroOrmConfig: {
			driver: SqliteDriver,
		},
	})
) {}

@ObjectType('Tag')
export class Tag extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}

@Resolver((of) => Tag)
class TagResolver extends createBaseResolver<Tag, any>(
	Tag,
	new MikroBackendProvider(class OrmTag extends BaseEntity {}, {
		connectionManagerId: 'sqlite',
		mikroOrmConfig: {
			driver: SqliteDriver,
		},
	})
) {}

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@Resolver()
export class AuthResolver extends PasswordAuthResolver {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver, TaskResolver, TagResolver],
	apolloServerOptions: {
		plugins: [passwordAuthApolloPlugin(async () => user)],
	},
});

describe('Password Authentication - Challenge', () => {
	test('should return an error to initiate a challenge for a password.', async () => {
		const responseTwo = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation updateEntity($data: TaskCreateOrUpdateInput!) {
					updateTask(data: $data) {
						id
					}
				}
			`,
			variables: {
				data: {
					id: '1',
				},
			},
		});

		assert(responseTwo.body.kind === 'single');
		expect(responseTwo.body.singleResult.errors?.[0]?.extensions?.acr).toBe('urn:gw:loa:2fa:pwd');
	});

	test.only('should return an error to initiate a challenge for a password when updating a nested entity.', async () => {
		const responseTwo = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation updateEntity($data: TaskCreateOrUpdateInput!) {
					updateTag(data: $data) {
						id
					}
				}
			`,
			variables: {
				data: {
					id: '1',
					tasks: [
						{
							id: '1',
						},
					],
				},
			},
		});

		assert(responseTwo.body.kind === 'single');
		expect(responseTwo.body.singleResult.errors?.[0]?.extensions?.acr).toBe('urn:gw:loa:2fa:pwd');
	});
});
