process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, Entity } from '@exogee/graphweaver';
import {
	UserProfile,
	ApplyAccessControlList,
	CredentialStorage,
	hashPassword,
	Password,
	setAddUserToContext,
	AclMap,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['user'],
	displayName: 'Test User',
});

class AlbumBackendProvider extends BaseDataProvider<any> {
	async find() {
		return [{ id: 1, title: 'Album Title', description: 'Album Description' }];
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
	title!: string;

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

describe('Column Level Security', () => {
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

	test('should return an error as user does not have access to description', async () => {
		assert(token);

		AclMap.delete('Album');
		ApplyAccessControlList({
			user: {
				all: {
					fieldRestrictions: ['description'],
					rowFilter: true,
				},
			},
		})(Album);

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					albums {
						id
						title
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0].message).toBe(
			'Cannot query field "description" on type "Album". [Suggestion hidden]?'
		);
	});
});
