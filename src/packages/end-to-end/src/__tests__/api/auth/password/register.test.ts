import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import {
	UserProfile,
	CredentialStorage,
	hashPassword,
	Password,
	setAddUserToContext,
	setImplicitAllow,
} from '@exogee/graphweaver-auth';
import assert from 'assert';
import { BaseDataProvider } from '@exogee/graphweaver';
import { set } from 'mockdate';

const user: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
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

describe('Password Authentication - Register', () => {
	test('should create a new user.', async () => {
		const response = await graphweaver.executeOperation<{
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
