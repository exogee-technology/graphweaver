process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, GraphQLEntity, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';
import {
	CredentialStorage,
	authApolloPlugin,
	UserProfile,
	Credential,
	hashPassword,
	Password,
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

describe('ACL - Implicit Deny', () => {
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

	test('should return forbidden in the before read hook when listing an entity when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					result: albums {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before create hook when no permission applied.', async () => {
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

	test('should return forbidden in the before update hook when no permission applied.', async () => {
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

	test('should return forbidden in the before delete hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'deleteOne');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: deleteAlbum(filter: { id: 1 })
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before delete hook when no permission applied.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'deleteMany');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation {
					result: deleteAlbums(filter: { id: 1 })
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
