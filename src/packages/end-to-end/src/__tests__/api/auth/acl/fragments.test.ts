process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider, RelationshipField } from '@exogee/graphweaver';
import {
	CredentialStorage,
	authApolloPlugin,
	UserProfile,
	hashPassword,
	Password,
	ApplyAccessControlList,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

const albumDataProvider = new BaseDataProvider<any>('album');

@ApplyAccessControlList({
	Everyone: {
		all: true,
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

	@RelationshipField<Album>(() => Artist, {
		id: (entity) => entity.artist?.id,
		nullable: true,
	})
	artist?: Artist;
}

const artistDataProvider = new BaseDataProvider<any>('artist');

@ApplyAccessControlList({})
@Entity('Artist', {
	provider: artistDataProvider,
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@Field(() => String)
	description!: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
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

describe('ACL - Fragments', () => {
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

	test('should return forbidden in the before read hook when listing an entity when no permission applied through an Album fragment spread.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				fragment albumFields on Album {
					album: artist {
						id
					}
				}
				query {
					result: albums {
						id
						...albumFields
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no permission applied through an Artist fragment spread.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				fragment artistFields on Artist {
					id
				}
				query {
					result: albums {
						id
						artist {
							...artistFields
						}
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});

	test('should return forbidden in the before read hook when listing an entity when no permission applied through an inline fragment.', async () => {
		assert(token);

		const spyOnDataProvider = jest.spyOn(albumDataProvider, 'find');

		const response = await graphweaver.server.executeOperation({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					albums {
						id
						... on Album {
							artist {
								id
							}
						}
					}
				}
			`,
		});

		expect(spyOnDataProvider).not.toHaveBeenCalled();

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe('Forbidden');
	});
});
