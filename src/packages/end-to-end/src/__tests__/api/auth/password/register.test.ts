import 'reflect-metadata';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import {
	authApolloPlugin,
	UserProfile,
	Credential,
	CredentialStorage,
	hashPassword,
	Password,
} from '@exogee/graphweaver-auth';
import assert from 'assert';
import { BaseDataEntity, BaseDataProvider } from '@exogee/graphweaver';

const user: CredentialStorage & BaseDataEntity = {
	id: '1',
	username: 'test',
	password: 'test123',
	isCollection: () => false,
	isReference: () => false,
};

class PasswordBackendProvider extends BaseDataProvider<
	CredentialStorage & BaseDataEntity,
	Credential<BaseDataEntity>
> {
	public async withTransaction<T>(callback: () => Promise<T>) {
		return await callback();
	}
	async createOne() {
		user.password = await hashPassword(user.password ?? '');
		return user;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	acl: {
		Everyone: {
			all: true,
		},
	},
	getUserProfile: async (id: string): Promise<UserProfile> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user, { implicitAllow: true })],
	},
});

describe('Password Authentication - Register', () => {
	test('should create a new user.', async () => {
		const response = await graphweaver.server.executeOperation<{
			createCredential: { id: string };
		}>({
			query: gql`
				mutation createCredential($input: CredentialInsertInput!) {
					createCredential(input: $input) {
						id
					}
				}
			`,
			variables: {
				input: {
					username: 'test',
					password: 'test1234',
					confirm: 'test1234',
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const token = response.body.singleResult.data?.createCredential?.id;
		expect(token).toBeDefined();
	});
});
