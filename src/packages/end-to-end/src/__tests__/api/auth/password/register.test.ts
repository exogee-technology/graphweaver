import 'reflect-metadata';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import { Resolver } from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	RequestParams,
	Credential,
} from '@exogee/graphweaver-auth';
import assert from 'assert';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new MikroBackendProvider(class OrmCred extends BaseEntity {}, {})
) {
	async authenticate(username: string, password: string) {
		return user;
	}
	async save(username: string, password: string, params: RequestParams): Promise<UserProfile> {
		return user;
	}
}

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

describe('Password Authentication - Register', () => {
	test('should register an unauthenticated user.', async () => {
		const response = await graphweaver.server.executeOperation<{
			createCredential: { id: string };
		}>({
			query: gql`
				mutation createCredential($data: CredentialInsertInput!) {
					createCredential(data: $data) {
						id
					}
				}
			`,
			variables: {
				data: {
					username: 'test',
					password: 'test',
					confirm: 'test',
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const token = response.body.singleResult.data?.createCredential?.id;
		expect(token).toBeDefined();
	});
});
