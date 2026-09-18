import { beforeAll, describe, expect, it } from 'vitest';
import { defineConnection, snakeCase } from '@exogee/graphweaver-sql';
import { buildEntityModels, postgresIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { runIntrospectionSuite } from '@exogee/graphweaver-sql/lib/testing';
import type { DatabaseSchemaIR } from '@exogee/graphweaver-sql/lib/introspection';
import { postgres } from '../driver';
import { ddl } from './ddl';

// GUARDED: these need a reachable PostgreSQL. `pnpm compose:up` starts one, or point PGHOST at
// your own. Skipping rather than failing keeps `pnpm -r test` meaningful on a machine without one.
const host = process.env.PGHOST;

if (!host) {
	describe.skip('introspection: postgres (set PGHOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	/**
	 * Round-trips the conformance schema: create it, read it back, and check the entity models we
	 * would generate actually describe it. This is the part MikroORM's DatabaseSchema.create() used to
	 * do, and the part Kysely cannot do at all, because it does not report foreign keys.
	 */
	describe('postgres introspection', () => {
		const connection = defineConnection({
			id: 'introspection-postgres',
			dialect: postgres({
				host: host!,
				port: Number(process.env.PGPORT ?? 5432),
				user: process.env.PGUSER ?? 'postgres',
				password: process.env.PGPASSWORD,
				database: process.env.PGDATABASE ?? 'graphweaver_sql_test',
			}),
		});

		let schema: DatabaseSchemaIR;

		beforeAll(async () => {
			await connection.connect();

			for (const table of ['track_genre', 'track', 'album', 'artist', 'genre', 'app_user']) {
				await connection.query({ text: `DROP TABLE IF EXISTS ${table}`, params: [] });
			}
			for (const statement of ddl) await connection.query({ text: statement, params: [] });

			schema = await postgresIntrospector.introspect(async (sql, params) => {
				const { rows } = await connection.query({
					text: sql,
					params: (params ?? []).map((value) => ({ value, type: 'unknown' as const })),
				});
				return rows as Record<string, unknown>[];
			});
		});

		it('finds every table', () => {
			expect(schema.tables.map((table) => table.name).sort()).toEqual([
				'album',
				'app_user',
				'artist',
				'genre',
				'track',
				'track_genre',
			]);
		});

		it('reads columns, types and nullability', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.columns.map((column) => column.name)).toEqual([
				'album_id',
				'title',
				'artist_id',
			]);
			expect(album.columns.find((c) => c.name === 'title')!.nullable).toBe(false);
			expect(album.columns.find((c) => c.name === 'artist_id')!.nullable).toBe(true);
		});

		it('spots the identity column', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.columns.find((c) => c.name === 'album_id')!.autoIncrement).toBe(true);
			expect(album.columns.find((c) => c.name === 'title')!.autoIncrement).toBe(false);
		});

		it('reads primary keys', () => {
			expect(schema.tables.find((t) => t.name === 'album')!.primaryKey!.columns).toEqual([
				'album_id',
			]);
			// The pivot's composite key is what identifies it as a pivot.
			expect(
				schema.tables.find((t) => t.name === 'track_genre')!.primaryKey!.columns.sort()
			).toEqual(['genre_id', 'track_id']);
		});

		it('reads foreign keys with their column pairing intact', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.foreignKeys).toHaveLength(1);
			expect(album.foreignKeys[0]).toMatchObject({
				columns: ['artist_id'],
				referencedTable: 'artist',
				referencedColumns: ['artist_id'],
			});
		});

		describe('entity models', () => {
			it('names entities in the singular and skips the pivot table', () => {
				const { entities } = buildEntityModels(schema, snakeCase);

				expect(entities.map((entity) => entity.name).sort()).toEqual([
					'Album',
					'AppUser',
					'Artist',
					'Genre',
					'Track',
				]);
			});

			it('turns a foreign key into a many-to-one and synthesises the inverse', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const album = entities.find((entity) => entity.name === 'Album')!;
				const artist = entities.find((entity) => entity.name === 'Artist')!;

				expect(album.relationships).toContainEqual(
					expect.objectContaining({ kind: 'manyToOne', property: 'artist', column: 'artist_id' })
				);
				expect(artist.relationships).toContainEqual(
					expect.objectContaining({ kind: 'oneToMany', property: 'albums', relatedField: 'artist' })
				);
			});

			it('turns the pivot into a many-to-many on both sides, with one owner', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const track = entities.find((entity) => entity.name === 'Track')!;
				const genre = entities.find((entity) => entity.name === 'Genre')!;

				const onTrack = track.relationships.find((r) => r.kind === 'manyToMany') as any;
				const onGenre = genre.relationships.find((r) => r.kind === 'manyToMany') as any;

				// Both sides exist and name each other, and exactly one owns the pivot. Which one is
				// decided alphabetically, so it is stable rather than meaningful.
				expect(onTrack).toMatchObject({ property: 'genres', relatedField: 'tracks' });
				expect(onGenre).toMatchObject({ property: 'tracks', relatedField: 'genres' });
				expect([onTrack.owning, onGenre.owning].filter(Boolean)).toHaveLength(1);

				const owner = onTrack.owning ? onTrack : onGenre;
				expect(owner.through).toMatchObject({
					table: 'track_genre',
					joinColumn: owner === onTrack ? 'track_id' : 'genre_id',
					inverseJoinColumn: owner === onTrack ? 'genre_id' : 'track_id',
				});
			});

			it('does not turn a foreign key column into a scalar property as well', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const album = entities.find((entity) => entity.name === 'Album')!;

				expect(album.properties.map((property) => property.property)).toEqual(['albumId', 'title']);
			});

			it('marks a client-generated primary key', () => {
				const { entities } = buildEntityModels(schema, snakeCase);

				// app_user.id is a plain text key with no default, so the client has to supply it.
				expect(entities.find((e) => e.name === 'AppUser')!.clientGeneratedPrimaryKeys).toBe(true);
				expect(entities.find((e) => e.name === 'Album')!.clientGeneratedPrimaryKeys).toBe(false);
			});

			it('records whether each name matches the naming strategy', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const album = entities.find((entity) => entity.name === 'Album')!;

				// album_id from albumId, so codegen can leave the override out.
				expect(album.properties.find((p) => p.property === 'albumId')!.isConventional).toBe(true);
				expect(album.tableIsConventional).toBe(true);
			});

			it('maps SQL types onto the column vocabulary', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const track = entities.find((entity) => entity.name === 'Track')!;

				expect(track.properties.find((p) => p.property === 'name')!.type).toBe('text');
				expect(track.properties.find((p) => p.property === 'milliseconds')!.type).toBe('int');
			});
		});
	});

	const shared = defineConnection({
		id: 'introspection-shared-postgres',
		dialect: postgres({
			host: host!,
			port: Number(process.env.PGPORT ?? 5432),
			user: process.env.PGUSER ?? 'postgres',
			password: process.env.PGPASSWORD,
			database: process.env.PGDATABASE ?? 'graphweaver_sql_test',
		}),
	});

	const sharedRaw = async (sql: string) => {
		const { rows } = await shared.query({ text: sql, params: [] });
		return rows as Record<string, unknown>[];
	};

	// The same assertions every other dialect is held to, so a divergence shows up as one dialect
	// failing a test its siblings pass.
	runIntrospectionSuite({
		hooks: { describe, it, beforeAll, beforeEach: () => undefined, expect },
		name: 'postgres',
		introspector: postgresIntrospector,
		setUp: async () => {
			await shared.connect();
			for (const table of ['track_genre', 'track', 'album', 'artist', 'genre', 'app_user']) {
				await sharedRaw(`DROP TABLE IF EXISTS ${table}`);
			}
			for (const statement of ddl) await sharedRaw(statement);
		},
		query: async (sql, params) => {
			const { rows } = await shared.query({
				text: sql,
				params: (params ?? []).map((value) => ({ value, type: 'unknown' as const })),
			});
			return rows as Record<string, unknown>[];
		},
	});
}
