process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, Entity, Filter } from '@exogee/graphweaver';
import {
	CredentialStorage,
	UserProfile,
	hashPassword,
	Password,
	ApplyAccessControlList,
	AclMap,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';

class AlbumDataProvider extends BaseDataProvider<Album> {
	async findOne(filter: Filter<Album>) {
		if (filter.id === 1) {
			return {
				id: 1,
				description: 'dummy album',
			};
		}

		return null;
	}
}
const albumDataProvider = new AlbumDataProvider('album');

@Entity('Album', {
	provider: albumDataProvider,
})
export class Album {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

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

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

let token: string | undefined;

describe('ACL - Create Or Update', () => {
	beforeAll(async () => {
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

		const response = await graphweaver.executeOperation({
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

		const response = await graphweaver.executeOperation({
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

		await graphweaver.executeOperation({
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

		await graphweaver.executeOperation({
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
