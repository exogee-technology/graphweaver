process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider, Field, ID, Entity } from '@exogee/graphweaver';
import { authApolloPlugin, UserProfile, ApiKeyEntity, ApiKey } from '@exogee/graphweaver-auth';

class TaskProvider extends BaseDataProvider<any> {
	public async withTransaction<T>(callback: () => Promise<T>) {
		return await callback();
	}
	async findOne({ id }: any) {
		return {
			id,
			description: 'Test Task',
		};
	}
	async find() {
		return [{ id: '1', description: 'Test Task' }];
	}
}

@Entity('Task', {
	provider: new TaskProvider('TaskProvider'),
})
export class Task {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

class ApiKeyBackendProvider extends BaseDataProvider<ApiKeyEntity<Roles>> {
	async findOne({ key }: any): Promise<any> {
		if (key === 'test_fail') {
			return null;
		}

		if (key === 'test_revoked') {
			return {
				id: '1',
				key: 'test_revoked',
				secret:
					'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
				revoked: true,
				roles: ['admin'],
			};
		}

		if (key === 'test') {
			return {
				id: '2',
				key: 'test',
				secret:
					'$argon2id$v=19$m=65536,t=3,p=4$VCKXMZROC0Bg0Flbi9Khsg$NCOmYbM/wkuwUqB82JoOr0KzCyYsPd2WRGjy3cik0mk',
				revoked: false,
				roles: ['admin'],
			};
		}
		return null;
	}
}
const apiKeyDataProvider = new ApiKeyBackendProvider('ApiKey');

new ApiKey<Roles>({
	provider: apiKeyDataProvider,
	acl: undefined,
	roles: Roles,
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [
			authApolloPlugin(async () => ({}) as UserProfile<any>, {
				apiKeyDataProvider,
				implicitAllow: true,
			}),
		],
	},
});

describe('API Key Authentication', () => {
	test('should return a E0001 error when no system user is found.', async () => {
		const base64EncodedCredentials = Buffer.from('test_fail:test').toString('base64');

		const response = await graphweaver.executeOperation({
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

		const response = await graphweaver.executeOperation({
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

		const response = await graphweaver.executeOperation({
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

		const response = await graphweaver.executeOperation({
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
