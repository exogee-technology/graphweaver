process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, Entity } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	ApplyAccessControlList,
	CredentialStorage,
	Password,
	hashPassword,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const albumDataProvider = new BaseDataProvider<any>('album');

@ApplyAccessControlList({
	Everyone: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ user: { id: context.user?.id } }),
	},
})
@Entity('Album', {
	provider: albumDataProvider,
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const cred: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
};

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		cred.password = await hashPassword(cred.password ?? '');
		return cred;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async () => user,
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Without Transaction Before Hook', () => {
	beforeAll(async () => {
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

		token = loginResponse.body.singleResult.data?.loginPassword?.authToken;
		expect(token).toContain('Bearer ');
	});

	test('should return forbidden in the before create hook when the ACL returns a function of a filter and there is no transaction.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'createOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: createAlbum(input: { description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when the ACL returns a function of a filter and there is no transaction.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'updateOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: updateAlbum(input: { id: 1, description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
