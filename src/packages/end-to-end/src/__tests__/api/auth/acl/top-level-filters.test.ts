process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.DATABASE = 'sqlite';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	Ref,
	ManyToOne,
	OneToMany,
	PrimaryKey,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField, BaseDataProvider } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { SqliteDriver } from '@mikro-orm/sqlite';
import { ApplyAccessControlList, CredentialStorage, hashPassword, Password, setAddUserToContext, UserProfile } from '@exogee/graphweaver-auth';

/* SQLite data entities */

@DataEntity({ tableName: 'Album' })
class OrmAlbum {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@ManyToOne({
		entity: () => OrmArtist,
		ref: true,
		fieldName: 'ArtistId',
		index: 'IFK_AlbumArtistId',
	})
	artist!: Ref<OrmArtist>;
}
@DataEntity({ tableName: 'Artist' })
class OrmArtist {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

	@OneToMany({ entity: () => OrmAlbum, mappedBy: 'artist' })
	albums = new Collection<OrmAlbum>(this);
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [OrmAlbum, OrmArtist],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
	},
};

/* Graphweaver Entities */
@ApplyAccessControlList({
    Everyone: {
        all: (context) => ({ id: context.user?.id }),
    },
})
@Entity('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album {
	@Field(() => ID)
	id!: number;

	@RelationshipField<OrmAlbum>(() => Artist, {
		id: (entity) => entity.artist?.id,
	})
	renamed_artist!: Artist;
}

@ApplyAccessControlList({
    Everyone: {
        all: (context) => {
            if (context.user?.roles?.[0] === 'admin') return true;
            return { id: "2" };
        },
    },
})
@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	@Field(() => ID)
	id!: number;

	@RelationshipField<Album>(() => [Album], { relatedField: 'renamed_artist' })
	renamed_albums!: Album[];
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

describe('Compound filter tests', () => {
    beforeAll(async () => {
        await ConnectionManager.connect('sqlite', connection);
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
    test('Top-level _and filter', async () => {
        const response = await graphweaver.executeOperation({
            http: { headers: new Headers({ authorization: token ?? '' }) } as any,
            query: gql`
                query artists($filter: ArtistsListFilter) {
                    artists(filter: $filter) {
                        id
                    }
                }
            `,
            variables: {
                "filter": {
                  "_and": [
                    { "id": "2"}, 
                    { "id": "1"}
                  ]
                }
              }
        });

        assert(response.body.kind === 'single');
        expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
        expect(response.body.singleResult.data?.artists).toHaveLength(0);
    });
    test('Top-level _or filter', async () => {
        const response = await graphweaver.executeOperation<{
            artists: { id: string }[];
        }>({
            http: { headers: new Headers({ authorization: token ?? '' }) } as any,
            query: gql`
                query artists($filter: ArtistsListFilter) {
                    artists(filter: $filter) {
                        id
                    }
                }
            `,
            variables: {
                "filter": {
                  "_or": [
                    { "id": "2"}, 
                    { "id": "1"}
                  ]
                }
              }
        });

        assert(response.body.kind === 'single');
        expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
        expect(response.body.singleResult.data?.artists).toHaveLength(2);
    });
    test('ACLs are still being respected', async () => {
        const response = await graphweaver.executeOperation<{
            artists: { id: string }[];
        }>({
            query: gql`
                query artists($filter: ArtistsListFilter) {
                    artists(filter: $filter) {
                        id
                    }
                }
            `,
            variables: {
                "filter": {
                  "_or": [
                    { "id": "2"}, 
                    { "id": "1"}
                  ]
                }
              }
        });

        assert(response.body.kind === 'single');
        expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
        expect(response.body.singleResult.data?.artists).toHaveLength(1);
        expect(response.body.singleResult.data?.artists[0].id).toEqual("2");
    });
});