process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.PASSWORD_CHALLENGE_JWT_EXPIRES_IN = '30m';

import MockDate from 'mockdate';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider, Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import {
	UserProfile,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	Password,
	CredentialStorage,
	hashPassword,
	setImplicitAllow,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';

class TaskProvider extends BaseDataProvider<any> {
	public async withTransaction<T>(callback: () => Promise<T>) {
		return await callback();
	}
	async updateOne(data: any) {
		return data;
	}
	async findOne(data: any) {
		return data;
	}
}

@ApplyMultiFactorAuthentication<Task>(() => ({
	Everyone: {
		// all users must provide a password mfa when writing data
		Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.PASSWORD] }],
	},
}))
@Entity('Task', {
	provider: new TaskProvider('Task'),
})
class Task {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];
}

@Entity('Tag', {
	provider: new BaseDataProvider('Tag'),
})
class Tag {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		const user: CredentialStorage = {
			id: '1',
			username: 'test',
			password: await hashPassword('test123'),
		};
		return user;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (): Promise<UserProfile<unknown>> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

setAddUserToContext(async () => user);
setImplicitAllow(true);

const graphweaver = new Graphweaver();

describe('Password Authentication - Challenge', () => {
	test('should return an error to initiate a challenge for a password.', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation updateEntity($input: TaskUpdateInput!) {
					updateTask(input: $input) {
						id
					}
				}
			`,
			variables: {
				input: {
					id: '1',
				},
			},
		});

		assert(response.body.kind === 'single');
		console.error(response.body.singleResult.errors);
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Authentication Error: Expected Token.'
		);
	});

	test('should return an error to initiate a challenge for a password when updating a nested entity.', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation updateEntity($input: TagUpdateInput!) {
					updateTag(input: $input) {
						id
					}
				}
			`,
			variables: {
				input: {
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
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Authentication Error: Expected Token.'
		);
	});

	test('should fail challenge if not logged in.', async () => {
		const response = await graphweaver.executeOperation({
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

		const token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		assert(token);

		// 2. Step up auth to include password MFA
		const challengeResponse = await graphweaver.executeOperation<{
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
		const response = await graphweaver.executeOperation({
			http: { headers: new Headers({ authorization: steppedUpToken }) } as any,
			query: gql`
				mutation updateEntity($input: TaskUpdateInput!) {
					updateTask(input: $input) {
						id
					}
				}
			`,
			variables: {
				input: {
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
		const expiredResponse = await graphweaver.executeOperation({
			http: { headers: new Headers({ authorization: steppedUpToken }) } as any,
			query: gql`
				mutation updateEntity($input: TaskUpdateInput!) {
					updateTask(input: $input) {
						id
					}
				}
			`,
			variables: {
				input: {
					id: '1',
				},
			},
		});

		assert(expiredResponse.body.kind === 'single');
		expect(expiredResponse.body.singleResult.errors?.[0]?.extensions?.code).toBe('CHALLENGE');
	});
});
