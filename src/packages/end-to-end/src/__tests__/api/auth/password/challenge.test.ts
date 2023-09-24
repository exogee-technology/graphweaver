import 'reflect-metadata';
import MockDate from 'mockdate';
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
	authApolloPlugin,
	UserProfile,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
} from '@exogee/graphweaver-auth';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';

@ApplyMultiFactorAuthentication<Task>({
	Everyone: {
		// all users must provide a password mfa when writing data
		write: [{ factorsRequired: 1, providers: [AuthenticationMethod.PASSWORD] }],
	},
})
@ObjectType('Task')
export class Task extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];
}

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
	username: 'test',
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
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Password Authentication - Challenge', () => {
	test('should return an error to initiate a challenge for a password.', async () => {
		const response = await graphweaver.server.executeOperation<{
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('CHALLENGE');
	});

	test('should return an error to initiate a challenge for a password when updating a nested entity.', async () => {
		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation updateEntity($data: TagCreateOrUpdateInput!) {
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
							description: 'test',
						},
					],
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('CHALLENGE');
	});

	test('should fail challenge if not logged in.', async () => {
		const response = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			query: gql`
				mutation challengePassword($password: String!) {
					result: challengePassword(password: $password) {
						authToken
					}
				}
			`,
			variables: {
				password: 'test',
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Challenge unsuccessful: Token missing.'
		);
	});

	test('should step up auth for password after login.', async () => {
		// 1. Login to the server
		const loginResponse = await graphweaver.server.executeOperation<{
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

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		// 2. Step up auth to include password MFA
		const challengeResponse = await graphweaver.server.executeOperation<{
			challengePassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation challengePassword($password: String!) {
					challengePassword(password: $password) {
						authToken
					}
				}
			`,
			variables: {
				password: 'test123',
			},
		});

		assert(challengeResponse.body.kind === 'single');

		// Check we have a returned token
		const steppedUpToken = challengeResponse.body.singleResult.data?.challengePassword?.authToken;
		assert(steppedUpToken);
		expect(steppedUpToken).toContain('Bearer ');

		// Let's check that we have the MFA value in the token and that it has an expiry
		const payload = JSON.parse(atob(steppedUpToken?.split('.')[1] ?? '{}'));
		expect(payload.acr?.values?.pwd).toBeGreaterThan(Math.floor(Date.now() / 1000));

		// Let's check that the original expiry has not extended
		const originalPayload = JSON.parse(atob(token?.split('.')[1] ?? '{}'));
		expect(payload.exp).toBe(originalPayload.exp);

		// 3. Make a new request with the stepped up auth it should not throw
		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: steppedUpToken }) } as any,
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

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		// Fast forward time so that the MFA expires and the next request should fail
		const today = new Date();
		today.setHours(today.getHours() + 1);
		MockDate.set(today);

		// 4. Make a new request one hour later with the stepped up auth it should throw as it expired after 30m
		const expiredResponse = await graphweaver.server.executeOperation<{
			loginPassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: steppedUpToken }) } as any,
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

		assert(expiredResponse.body.kind === 'single');
		expect(expiredResponse.body.singleResult.errors?.[0]?.extensions?.code).toBe('CHALLENGE');
	});
});
