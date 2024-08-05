process.env.PASSWORD_AUTH_REDIRECT_URI = '*';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, BaseDataProvider, Entity, RelationshipField } from '@exogee/graphweaver';
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
albumDataProvider.backendProviderConfig = {
	filter: true,
	pagination: false,
	orderBy: false,
	sort: false,
};

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

	@RelationshipField<Artist>(() => Artist, { relatedField: 'albums' })
	artist!: Artist;
}

class ArtistBackendProvider extends BaseDataProvider<any> {
	async find() {
		return [{ id: 1, description: 'Album Description', albums: [1] }];
	}
}

const artistDataProvider = new ArtistBackendProvider('artist');

@ApplyAccessControlList({
	Everyone: {
		all: true,
	},
})
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

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query {
					albums {
						id
						title
						_description
					}
				}
			`,
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

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
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to description when creating', async () => {
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

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation createAlbum($input: AlbumInsertInput!) {
					createAlbum(input: $input) {
						id
						title
						_description
					}
				}
			`,
			variables: {
				input: {
					title: 'Album Title',
					_description: 'Album Description',
				},
			},
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation createAlbum($input: AlbumInsertInput!) {
					createAlbum(input: $input) {
						id
						title
						description
					}
				}
			`,
			variables: {
				input: {
					title: 'Album Title',
					description: 'Album Description',
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to read description when updating', async () => {
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

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{
			albums: Album[];
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation updateAlbum($input: AlbumUpdateInput!) {
					updateAlbum(input: $input) {
						id
						title
						_description
					}
				}
			`,
			variables: {
				input: {
					id: '1',
					title: 'Album Title',
					_description: 'Album Description',
				},
			},
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation updateAlbum($input: AlbumUpdateInput!) {
					updateAlbum(input: $input) {
						id
						title
						description
					}
				}
			`,
			variables: {
				input: {
					id: '1',
					title: 'Album Title',
					description: 'Album Description',
				},
			},
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to write to the description field', async () => {
		assert(token);

		AclMap.delete('Album');
		ApplyAccessControlList({
			user: {
				read: true,
				write: {
					fieldRestrictions: ['description'],
					rowFilter: true,
				},
			},
		})(Album);

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{
			albums: Album[];
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation updateAlbum($input: AlbumUpdateInput!) {
					updateAlbum(input: $input) {
						id
						title
						description
					}
				}
			`,
			variables: {
				input: {
					id: '1',
					title: 'Album Title',
					_description: 'Album Description',
				},
			},
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				mutation updateAlbum($input: AlbumUpdateInput!) {
					updateAlbum(input: $input) {
						id
						title
						description
					}
				}
			`,
			variables: {
				input: {
					id: '1',
					title: 'Album Title',
					description: 'Album Description',
				},
			},
		});

		assert(response.body.kind === 'single');
		console.log(response.body.singleResult.errors);
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to read to the description field when used as a filter', async () => {
		assert(token);

		AclMap.delete('Album');
		ApplyAccessControlList({
			user: {
				read: {
					fieldRestrictions: ['description'],
					rowFilter: true,
				},
			},
		})(Album);

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{
			albums: Album[];
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query albums($filter: AlbumsListFilter) {
					albums(filter: $filter) {
						id
					}
				}
			`,
			variables: {
				filter: {
					// This does not exist and gives us the standard error that we match against
					_description: 'Album Description',
				},
			},
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace(/_description/g, 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query albums($filter: AlbumsListFilter) {
					albums(filter: $filter) {
						id
					}
				}
			`,
			variables: {
				filter: {
					description: 'Album Description',
				},
			},
		});

		assert(response.body.kind === 'single');
		console.log(response.body.singleResult.errors);
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to read description when reading a nested entity', async () => {
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

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{
			albums: Album[];
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query artists {
					artists {
						id
						albums {
							id
							_description
						}
					}
				}
			`,
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query artists {
					artists {
						id
						albums {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});

	test('should return an error as user does not have access to read description when reading a nested filter', async () => {
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

		const fieldDoesNotExistResponse = await graphweaver.executeOperation<{
			albums: Album[];
		}>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query artists {
					artists {
						id
						albums(filter: { _description: "Album Description" }) {
							id
						}
					}
				}
			`,
		});

		assert(fieldDoesNotExistResponse.body.kind === 'single');
		expect(fieldDoesNotExistResponse.body.singleResult.data).toBeUndefined();
		expect(fieldDoesNotExistResponse.body.singleResult.errors).toBeDefined();

		let error = fieldDoesNotExistResponse.body.singleResult.errors?.[0];
		assert(error);
		error = {
			...error,
			// Change the error message to match the expected error message
			message: error.message.replace('_description', 'description'),
		};

		const response = await graphweaver.executeOperation<{ albums: Album[] }>({
			http: { headers: new Headers({ authorization: token }) } as any,
			query: gql`
				query artists {
					artists {
						id
						albums(filter: { description: "Album Description" }) {
							id
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data).toBeUndefined();
		expect(response.body.singleResult.errors).toBeDefined();

		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0]).toStrictEqual(error);
	});
});
