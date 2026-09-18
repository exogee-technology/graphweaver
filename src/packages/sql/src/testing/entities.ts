import { Entity, ID, graphweaverMetadata } from '@exogee/graphweaver';
// The repo's own scalars package. Importing JSON from graphql-scalars instead would register a
// second scalar also named "JSON", and schema building refuses two types with one name.
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { Field, ManyToMany, ManyToOne, OneToMany } from '../decorators';
import type { SqlConnection } from '../connection/connection';
import { SqlDataProvider } from '../provider';

export interface UserStorage {
	passwordHash: string;
	tenantId: string;
}

/**
 * The entity graph the conformance suite runs against. Every dialect gets the same one, which is
 * the point: the assertions are shared, so a divergence shows up as a dialect failing a test its
 * siblings pass rather than as a test nobody wrote.
 *
 * Note each entity is declared exactly once. There is no second data-entity class anywhere.
 */
export const defineTestEntities = (connection: SqlConnection) => {
	@Entity<Artist>('Artist', { provider: new SqlDataProvider(() => Artist, connection) })
	class Artist {
		@Field(() => ID, { primaryKeyField: true })
		artistId!: number;

		@Field(() => String)
		name!: string;

		@OneToMany(() => [Album], { relatedField: 'artist' })
		albums!: Album[];
	}

	@Entity<Album>('Album', { provider: new SqlDataProvider(() => Album, connection) })
	class Album {
		@Field(() => ID, { primaryKeyField: true })
		albumId!: number;

		@Field(() => String)
		title!: string;

		@ManyToOne(() => Artist, { nullable: true })
		artist?: Artist;

		@OneToMany(() => [Track], { relatedField: 'album' })
		tracks!: Track[];
	}

	@Entity<Track>('Track', { provider: new SqlDataProvider(() => Track, connection) })
	class Track {
		@Field(() => ID, { primaryKeyField: true })
		trackId!: number;

		@Field(() => String)
		name!: string;

		@Field(() => Number, { nullable: true })
		milliseconds?: number;

		@ManyToOne(() => Album, { nullable: true })
		album?: Album;

		@ManyToMany(() => [Genre], {
			relatedField: 'tracks',
			through: { table: 'track_genre', joinColumn: 'track_id', inverseJoinColumn: 'genre_id' },
		})
		genres!: Genre[];
	}

	@Entity<Genre>('Genre', { provider: new SqlDataProvider(() => Genre, connection) })
	class Genre {
		@Field(() => ID, { primaryKeyField: true })
		genreId!: number;

		@Field(() => String)
		name!: string;

		@ManyToMany(() => [Track], { relatedField: 'genres' })
		tracks!: Track[];
	}

	// passwordHash and tenantId exist in the database but never reach the schema.
	@Entity<User>('User', {
		provider: new SqlDataProvider<User, UserStorage>(() => User, connection, {
			table: 'app_user',
			hidden: {
				passwordHash: { type: 'string', column: 'password_hash', select: false },
				tenantId: { type: 'string', column: 'tenant_id' },
			},
		}),
		apiOptions: { clientGeneratedPrimaryKeys: true },
	})
	class User {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@Field(() => String)
		username!: string;

		// Only Postgres has real arrays, so a list is stored as a delimited string -- which is
		// also what MikroORM wrote, so existing data keeps reading.
		@Field(() => [String], {
			columnType: 'array',
			columnMeta: { items: 'string', arrayEncoding: 'delimited' },
			nullable: true,
		})
		roles?: string[];

		// JSON is where a double-encode hides: it round trips through a string, so encoding it
		// twice still stores and reads without error, just wrongly.
		@Field(() => GraphQLJSON, { columnType: 'json', nullable: true })
		preferences?: Record<string, unknown>;
	}

	return { Artist, Album, Track, Genre, User };
};

/** The seed every dialect loads, as plain portable INSERTs. */
void graphweaverMetadata;

export const SEED_STATEMENTS = [
	`INSERT INTO artist (artist_id, name) VALUES (1, 'Alanis Morissette')`,
	`INSERT INTO artist (artist_id, name) VALUES (2, 'Radiohead')`,
	`INSERT INTO album (album_id, title, artist_id) VALUES (1, 'Jagged Little Pill', 1)`,
	`INSERT INTO album (album_id, title, artist_id) VALUES (2, 'OK Computer', 2)`,
	`INSERT INTO album (album_id, title, artist_id) VALUES (3, 'Orphan Album', NULL)`,
	`INSERT INTO track (track_id, name, album_id, milliseconds) VALUES (1, 'You Oughta Know', 1, 249000)`,
	`INSERT INTO track (track_id, name, album_id, milliseconds) VALUES (2, 'Ironic', 1, 229000)`,
	`INSERT INTO track (track_id, name, album_id, milliseconds) VALUES (3, 'Paranoid Android', 2, 383000)`,
	`INSERT INTO track (track_id, name, album_id, milliseconds) VALUES (4, 'Karma Police', 2, 264000)`,
	`INSERT INTO genre (genre_id, name) VALUES (1, 'Rock')`,
	`INSERT INTO genre (genre_id, name) VALUES (2, 'Alternative')`,
	`INSERT INTO track_genre (track_id, genre_id) VALUES (1, 1)`,
	`INSERT INTO track_genre (track_id, genre_id) VALUES (2, 1)`,
	`INSERT INTO track_genre (track_id, genre_id) VALUES (3, 1)`,
	`INSERT INTO track_genre (track_id, genre_id) VALUES (3, 2)`,
	`INSERT INTO track_genre (track_id, genre_id) VALUES (4, 2)`,
	`INSERT INTO app_user (id, username, password_hash, tenant_id, roles, preferences) VALUES ('u1', 'kevin', 'hash-one', 'tenant-a', 'admin,editor', '{"theme":"dark"}')`,
	`INSERT INTO app_user (id, username, password_hash, tenant_id, roles, preferences) VALUES ('u2', 'sam', 'hash-two', 'tenant-b', '', '{}')`,
];

/** Dropped in dependency order, so foreign keys never block the reset. */
export const TABLES_IN_DROP_ORDER = [
	'track_genre',
	'track',
	'album',
	'artist',
	'genre',
	'app_user',
];
