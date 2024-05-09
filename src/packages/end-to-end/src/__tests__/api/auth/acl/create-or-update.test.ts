process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, GraphQLEntity, ID, BaseDataProvider, Entity } from '@exogee/graphweaver';
import {
	CredentialStorage,
	authApolloPlugin,
	UserProfile,
	Credential,
	hashPassword,
	Password,
	ApplyAccessControlList,
	AclMap,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const albumDataProvider = new BaseDataProvider<any, Album>('album');

@Entity('Album', {
	provider: albumDataProvider,
})
export class Album extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const cred: CredentialStorage = {
	id: '1',
	username: 'test',
	password: 'test123',
	isCollection: () => false,
	isReference: () => false,
};

class PasswordBackendProvider extends BaseDataProvider<
	CredentialStorage,
	Credential<CredentialStorage>
> {
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

describe('ACL - Create Or Update', () => {
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

	beforeEach(() => {
		jest.resetAllMocks();
	});

	test('should return forbidden in the before create hook when user only has permission to update.', async () => {
		assert(token);

		const spyOnDataProviderUpdateOne = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnDataProviderCreateOne = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				update: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: [{ description: "test" }]) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProviderUpdateOne).not.toHaveBeenCalled();
		expect(spyOnDataProviderCreateOne).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before update hook when user only has permission to create.', async () => {
		assert(token);

		const spyOnDataProviderUpdateOne = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnDataProviderCreateOne = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				create: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: [{ id: "1", description: "test" }]) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProviderUpdateOne).not.toHaveBeenCalled();
		expect(spyOnDataProviderCreateOne).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should allow in the before create hook when user has permission to create.', async () => {
		assert(token);

		const spyOnDataProviderUpdateOne = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnDataProviderCreateOne = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				create: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: [{ description: "test" }]) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProviderCreateOne).toHaveBeenCalled();
		expect(spyOnDataProviderUpdateOne).not.toHaveBeenCalled();
	});

	test('should allow in the before update hook when user has permission to update.', async () => {
		assert(token);

		const spyOnDataProviderUpdateOne = jest.spyOn(albumDataProvider, 'updateOne');
		const spyOnDataProviderCreateOne = jest.spyOn(albumDataProvider, 'createOne');

		AclMap.delete('Album');
		ApplyAccessControlList({
			Everyone: {
				read: true,
				update: true,
			},
		})(Album);

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					createOrUpdateAlbums(input: [{ id: "1", description: "test" }]) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProviderUpdateOne).toHaveBeenCalled();
		expect(spyOnDataProviderCreateOne).not.toHaveBeenCalled();
	});
});
