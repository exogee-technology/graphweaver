process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';
import {
	CredentialStorage,
	UserProfile,
	hashPassword,
	Password,
	ApplyAccessControlList,
	AclMap,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin', 'user'],
	displayName: 'Test User',
});

class AlbumBackendProvider extends BaseDataProvider<any> {
	async findOne() {
		return { id: '1' };
	}
}
const albumDataProvider = new AlbumBackendProvider('album');

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

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

let token: string | undefined;

describe('ACL - Multiple Roles', () => {
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

	test('should return true when listing a single entity and one role explicitly allows access.', async () => {
		assert(token);

		AclMap.delete('Album');
		ApplyAccessControlList({
			admin: {
				all: true,
			},
			user: {
				all: () => false,
			},
		})(Album);

		const response = await graphweaver.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					album(id: 1) {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		expect(response.body.singleResult.data?.album).toEqual({ id: '1' });
	});
});
