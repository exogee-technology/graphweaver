import 'reflect-metadata';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import { CreateOrUpdateHookParams, Resolver } from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	RequestParams,
	Credential,
	CredentialCreateOrUpdateInputArgs,
} from '@exogee/graphweaver-auth';
import assert from 'assert';
import { BaseEntity, ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { SqliteDriver } from '@mikro-orm/sqlite';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new MikroBackendProvider(class OrmCred extends BaseEntity {}, connection)
) {
	async authenticate(username: string, password: string) {
		return user;
	}
	async create(params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>) {
		return user;
	}
	async update(
		params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
	): Promise<UserProfile> {
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
	test('should create a new user.', async () => {
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
