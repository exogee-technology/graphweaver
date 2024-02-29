process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	CreateOrUpdateHookParams,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	BaseDataProvider,
	Resolver,
	createBaseResolver,
} from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	Credential,
	CredentialCreateOrUpdateInputArgs,
	ApplyAccessControlList,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@ApplyAccessControlList({
	Everyone: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ user: { id: context.user?.id } }),
	},
})
@ObjectType('Album')
export class Album extends GraphQLEntity<any> {
	public dataEntity!: any;

	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;
}

const albumDataProvider = new Provider<any, Album>('album');

@Resolver((of) => Album)
class AlbumResolver extends createBaseResolver<Album, any>(Album, albumDataProvider) {}

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new BaseDataProvider('auth')
) {
	async authenticate(username: string, password: string) {
		if (password === 'test123') return user;
		throw new Error('Unknown username or password, please try again');
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
	resolvers: [AuthResolver, AlbumResolver],
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
					result: createAlbum(data: { description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

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
					result: updateAlbum(data: { id: 1, description: "test" }) {
						id
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toBeCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
