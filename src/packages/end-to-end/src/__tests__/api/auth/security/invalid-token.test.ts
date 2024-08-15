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

describe('Security', () => {
	test('should give the correct error for an invalid token', async () => {
		const response = await graphweaver.executeOperation<{
			challengePassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: 'Bearer aGVsbG8=' }) } as any,
			query: gql`
				query {
					tags {
						name
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toEqual(
			'Unauthorized: Token verification failed.'
		);
		expect(response.http.headers.get('X-Auth-Redirect')).toBe(
			`${process.env.AUTH_BASE_URI}/auth/login?redirect_uri=${encodeURIComponent(
				process.env.AUTH_BASE_URI + '/'
			)}`
		);
	});
});
