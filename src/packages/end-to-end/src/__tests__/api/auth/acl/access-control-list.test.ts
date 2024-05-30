process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, Entity } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	Credential,
	ApplyAccessControlList,
	AclMap,
	CredentialStorage,
	hashPassword,
	Password,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const artistDataProvider = new BaseDataProvider<any>('artist');

@Entity('Artist', {
	provider: artistDataProvider,
})
export class Artist {
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
	getUserProfile: async (id: string) => user,
});

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
});

let token: string | undefined;

describe('ACL - Access Control Lists', () => {
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

	test('should return forbidden in the before read hook when listing an entity when no an acl evaluates to false.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: () => false,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no an acl evaluates to promise false.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: async () => false,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no an acl evaluates to promise null.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: async () => null,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no an acl evaluates to promise undefined.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: async () => undefined,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should call the data provider when a filter function returns a filter object.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: async () => ({
					id: '1',
				}),
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).toHaveBeenCalled();
	});

	test('should call the data provider when a filter function returns a boolean true.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: async () => true,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).toHaveBeenCalled();
	});

	test('should call the data provider when a acl returns a boolean of true.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(artistDataProvider, 'find');

		AclMap.delete('Artist');
		ApplyAccessControlList({
			Everyone: {
				all: true,
			},
		})(Artist);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					artists {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).toHaveBeenCalled();
	});
});
