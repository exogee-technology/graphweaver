import { AggregationType, RELATED_ID_KEYS, graphweaverMetadata } from '@exogee/graphweaver';
import type { SqlConnection } from '../connection/connection';
import { FOREIGN_KEYS } from '../decorators';
import { sql } from '../connection/raw';
import type { SqlDataProvider } from '../provider';
import { defineTestEntities, SEED_STATEMENTS, TABLES_IN_DROP_ORDER } from './entities';
import type { UserStorage } from './entities';
import { byCodeUnit } from '../order';

/**
 * The test framework's hooks, passed in rather than imported.
 *
 * This module is published as part of the package, so importing vitest here would both pull a test
 * framework into the build and stop the suite being usable from node:test, which is what the end to
 * end package runs.
 */
export interface TestHooks {
	// Property syntax rather than method syntax: these get destructured, and method syntax makes
	// that look like an unbound `this` to the linter.
	describe: (name: string, body: () => void) => void;
	it: (name: string, body: () => Promise<void> | void) => void;
	beforeAll: (body: () => Promise<void> | void) => void;
	beforeEach: (body: () => Promise<void> | void) => void;
	expect: any;
}

export interface ConformanceSetup {
	hooks: TestHooks;
	/** The dialect under test, used to name the suite. */
	name: string;
	connection: SqlConnection;
	/** DDL for the test schema. Only this differs between dialects. */
	ddl: string[];
	/** Runs a statement outside the provider, for setup and for asserting on raw rows. */
	raw(sql: string): Promise<Record<string, unknown>[]>;
	/**
	 * Statements to run after seeding. Postgres needs its identity sequences moved past the
	 * explicit ids in the seed, or the first generated key collides with a seeded row.
	 */
	afterSeed?: string[];
	/**
	 * Wraps each seed INSERT.
	 *
	 * SQL Server refuses an explicit value for an identity column unless IDENTITY_INSERT is on,
	 * and that setting is per table *and* per connection -- so it has to travel in the same batch
	 * as the insert itself rather than being set up front.
	 */
	wrapSeed?: (sql: string) => string;
}

const provider = <T>(name: string) =>
	graphweaverMetadata.getEntityByName(name)!.provider as unknown as T;

/**
 * The assertions every dialect has to satisfy.
 *
 * Golden SQL tests prove we generate the statement we meant to. This proves the statement actually
 * runs, that values survive the round trip, and that the dataloader contract holds -- none of which
 * a snapshot can tell you.
 */
export const runConformanceSuite = (setup: ConformanceSetup) => {
	const { describe, it, beforeAll, beforeEach, expect } = setup.hooks;

	describe(`conformance: ${setup.name}`, () => {
		defineTestEntities(setup.connection);

		let albums: SqlDataProvider<any, any>;
		let tracks: SqlDataProvider<any, any>;
		let genres: SqlDataProvider<any, any>;
		let artists: SqlDataProvider<any, any>;
		let users: SqlDataProvider<any, UserStorage>;

		beforeAll(async () => {
			await setup.connection.connect();

			albums = provider('Album');
			tracks = provider('Track');
			genres = provider('Genre');
			artists = provider('Artist');
			users = provider('User');
		});

		beforeEach(async () => {
			for (const table of TABLES_IN_DROP_ORDER) {
				await setup.raw(`DROP TABLE IF EXISTS ${table}`);
			}
			for (const statement of setup.ddl) await setup.raw(statement);
			for (const statement of SEED_STATEMENTS) {
				await setup.raw(setup.wrapSeed ? setup.wrapSeed(statement) : statement);
			}
			for (const statement of setup.afterSeed ?? []) await setup.raw(statement);
		});

		const genreIdsFor = async (trackId: number) =>
			(
				await setup.raw(
					`SELECT genre_id FROM track_genre WHERE track_id = ${trackId} ORDER BY genre_id`
				)
			).map((row) => Number(row.genre_id));

		describe('reads', () => {
			it('maps columns back to properties', async () => {
				const rows = await albums.find({});

				expect(rows).toHaveLength(3);
				expect(rows[0]).toMatchObject({ title: 'Jagged Little Pill' });
			});

			it('filters on a scalar', async () => {
				expect(await albums.find({ title: 'OK Computer' })).toHaveLength(1);
			});

			it('collapses a many-to-one on the related key to a foreign key test', async () => {
				expect((await albums.find({ artist: { artistId: 2 } })).map((r: any) => r.title)).toEqual([
					'OK Computer',
				]);
			});

			it('filters through a many-to-one via EXISTS', async () => {
				expect(
					(await albums.find({ artist: { name: 'Radiohead' } })).map((r: any) => r.title)
				).toEqual(['OK Computer']);
			});

			it('filters through a one-to-many', async () => {
				expect(
					(await albums.find({ tracks: { name: 'Ironic' } })).map((r: any) => r.title)
				).toEqual(['Jagged Little Pill']);
			});

			it('filters through a many-to-many pivot', async () => {
				expect(
					(await tracks.find({ genres: { name: 'Alternative' } }))
						.map((r: any) => r.name)
						.sort(byCodeUnit)
				).toEqual(['Karma Police', 'Paranoid Android']);
			});

			it('negates a to-many as NOT EXISTS', async () => {
				// Paranoid Android is in both genres, so a join based reading would wrongly keep it.
				expect(
					(await tracks.find({ _not: { genres: { name: 'Alternative' } } }))
						.map((r: any) => r.name)
						.sort(byCodeUnit)
				).toEqual(['Ironic', 'You Oughta Know']);
			});

			it('reads null and empty object on a many-to-one as absence and presence', async () => {
				expect((await albums.find({ artist: null } as any)).map((r: any) => r.title)).toEqual([
					'Orphan Album',
				]);
				expect(await albums.find({ artist: {} })).toHaveLength(2);
			});

			it('answers _exists on each relationship kind', async () => {
				// Orphan Album is the one with no artist and no tracks.
				expect((await albums.find({ tracks_exists: false })).map((r: any) => r.title)).toEqual([
					'Orphan Album',
				]);
				expect(
					(await albums.find({ tracks_exists: true })).map((r: any) => r.title).sort(byCodeUnit)
				).toEqual(['Jagged Little Pill', 'OK Computer']);

				expect((await albums.find({ artist_exists: false })).map((r: any) => r.title)).toEqual([
					'Orphan Album',
				]);

				// Every track is in at least one genre, so the pivot answers both ways.
				expect(await tracks.find({ genres_exists: true })).toHaveLength(4);
				expect(await tracks.find({ genres_exists: false })).toHaveLength(0);
			});

			it('orders and paginates', async () => {
				expect(
					(await albums.find({}, { orderBy: { title: 'DESC' }, limit: 2, offset: 0 } as any)).map(
						(r: any) => r.title
					)
				).toEqual(['Orphan Album', 'OK Computer']);
			});

			it('supports the operator set', async () => {
				expect(await tracks.find({ milliseconds_gte: 300000 })).toHaveLength(1);
				expect(await tracks.find({ name_like: '%Karma%' })).toHaveLength(1);
				expect(await tracks.find({ name_ilike: '%karma%' })).toHaveLength(1);
				expect(await tracks.find({ trackId_in: [1, 2] })).toHaveLength(2);
				expect(await tracks.find({ trackId_in: [] })).toHaveLength(0);
				expect(await tracks.find({ trackId_nin: [] })).toHaveLength(4);
				expect(await tracks.find({ milliseconds_null: true })).toHaveLength(0);
			});

			it('finds one, and null for a miss', async () => {
				expect(await albums.findOne({ albumId: 2 })).toMatchObject({ title: 'OK Computer' });
				expect(await albums.findOne({ albumId: 999 })).toBeNull();
			});

			it('counts with the filter applied', async () => {
				expect(await tracks.aggregate({}, new Set([AggregationType.COUNT]))).toEqual({ count: 4 });
				expect(
					await tracks.aggregate({ genres: { name: 'Rock' } }, new Set([AggregationType.COUNT]))
				).toEqual({ count: 3 });
			});
		});

		describe('findByRelatedId', () => {
			it('loads a many-to-one batch with no join', async () => {
				const rows = await albums.findByRelatedId(null as any, 'artist', ['1', '2']);

				expect(rows).toHaveLength(2);
				expect(rows.flatMap((r: any) => r[RELATED_ID_KEYS]).sort(byCodeUnit)).toEqual(['1', '2']);
			});

			it('gives a many-to-many record every key it matched', async () => {
				const rows = await tracks.findByRelatedId(null as any, 'genres', ['1', '2']);
				const byName = Object.fromEntries(
					rows.map((r: any) => [r.name, [...r[RELATED_ID_KEYS]].sort(byCodeUnit)])
				);

				// In both genres, so it comes back once carrying both keys.
				expect(byName['Paranoid Android']).toEqual(['1', '2']);
				expect(byName['Ironic']).toEqual(['1']);
				expect(rows).toHaveLength(4);
			});

			it('loads a one-to-many batch', async () => {
				const rows = await genres.findByRelatedId(null as any, 'tracks', ['3']);

				expect(rows.map((r: any) => r.name).sort(byCodeUnit)).toEqual(['Alternative', 'Rock']);
			});
		});

		describe('hidden columns', () => {
			it('keeps a select:false column out of ordinary reads', async () => {
				const [user] = await users.find({ username: 'kevin' });

				expect(user.tenantId).toBe('tenant-a');
				expect(user.passwordHash).toBeUndefined();
			});

			it('loads it on request', async () => {
				const [user] = await users.withColumns(['passwordHash']).find({ username: 'kevin' });

				expect(user.passwordHash).toBe('hash-one');
			});

			it('filters on it even though it is never selected', async () => {
				// WHERE never needs the SELECT list, which is what makes select:false safe.
				expect(
					(await users.find({ passwordHash: 'hash-two' } as any)).map((r: any) => r.username)
				).toEqual(['sam']);
			});
		});

		describe('writes', () => {
			it('creates one and returns the generated key', async () => {
				const created = await albums.createOne({ title: 'New Album' });

				expect(created.albumId).toBeDefined();
				expect(created.title).toBe('New Album');
				expect(await albums.find({})).toHaveLength(4);
			});

			it('creates many and returns them in input order', async () => {
				// Core pairs these with its inputs positionally to wire foreign keys.
				const created = await albums.createMany([
					{ title: 'First' },
					{ title: 'Second', artist: { artistId: 1 } } as any,
					{ title: 'Third' },
				]);

				expect(created.map((r: any) => r.title)).toEqual(['First', 'Second', 'Third']);
			});

			it('writes a foreign key from a many-to-one payload', async () => {
				const created = await albums.createOne({ title: 'Linked', artist: { artistId: 2 } } as any);

				expect((created as any)[FOREIGN_KEYS].artist).toBe(2);
			});

			it('updates one', async () => {
				expect(await albums.updateOne(1, { title: 'Renamed' } as any)).toMatchObject({
					title: 'Renamed',
				});
			});

			it('refuses to update a row that is not there', async () => {
				await expect(albums.updateOne(999, { title: 'Nope' } as any)).rejects.toThrow(
					/Unable to locate/
				);
			});

			it('never writes a generated primary key', async () => {
				expect(await albums.updateOne(1, { albumId: 42, title: 'Still One' } as any)).toMatchObject(
					{ albumId: 1 }
				);
			});

			it('splits createOrUpdateMany on what already exists', async () => {
				const result = await users.createOrUpdateMany([
					{ id: 'u1', username: 'kevin-renamed', passwordHash: 'x', tenantId: 'tenant-a' },
					{ id: 'u3', username: 'new-person', passwordHash: 'y', tenantId: 'tenant-c' },
				] as any);

				expect(result).toHaveLength(2);
				expect(await users.findOne({ id: 'u1' })).toMatchObject({ username: 'kevin-renamed' });
				expect(await users.findOne({ id: 'u3' })).toMatchObject({ username: 'new-person' });
			});

			it('deletes one', async () => {
				expect(await albums.deleteOne({ albumId: 3 })).toBe(true);
				expect(await albums.find({})).toHaveLength(2);
			});

			it('refuses a deleteOne matching several rows, before deleting anything', async () => {
				await expect(albums.deleteOne({ artist: {} })).rejects.toThrow(/more than one/);

				expect(await albums.find({})).toHaveLength(3);
			});

			it('deletes many', async () => {
				await setup.raw('DELETE FROM track_genre WHERE track_id IN (1, 2)');

				expect(await tracks.deleteMany({ album: { albumId: 1 } })).toBe(true);
				expect(await tracks.find({})).toHaveLength(2);
			});
		});

		describe('relationship linking', () => {
			it('adds the pivot rows a many-to-many payload asks for', async () => {
				await tracks.updateOne(4, { genres: [{ genreId: 1 }, { genreId: 2 }] } as any);

				expect(await genreIdsFor(4)).toEqual([1, 2]);
			});

			it('removes pivot rows left out, because the list replaces the collection', async () => {
				expect(await genreIdsFor(3)).toEqual([1, 2]);

				await tracks.updateOne(3, { genres: [{ genreId: 2 }] } as any);

				expect(await genreIdsFor(3)).toEqual([2]);
			});

			it('clears the collection for an empty list', async () => {
				await tracks.updateOne(3, { genres: [] } as any);

				expect(await genreIdsFor(3)).toEqual([]);
			});

			it('links a many-to-many on create', async () => {
				const created = await tracks.createOne({
					name: 'Fresh Track',
					genres: [{ genreId: 1 }],
				} as any);

				expect(await genreIdsFor(created.trackId)).toEqual([1]);
			});

			it('re-parents children named by a one-to-many payload', async () => {
				await albums.updateOne(1, {
					tracks: [{ trackId: 1 }, { trackId: 2 }, { trackId: 4 }],
				} as any);

				expect((await tracks.findOne({ trackId: 4 }))![FOREIGN_KEYS].album).toBe(1);
			});

			it('orphans children left out of a one-to-many payload', async () => {
				await albums.updateOne(1, { tracks: [{ trackId: 1 }] } as any);

				expect((await tracks.findOne({ trackId: 2 }))![FOREIGN_KEYS].album).toBeNull();
			});

			it('leaves a relationship alone when the payload does not mention it', async () => {
				await tracks.updateOne(3, { name: 'Renamed Only' } as any);

				expect(await genreIdsFor(3)).toEqual([1, 2]);
			});

			it('refuses a linking payload with no primary key', async () => {
				await expect(tracks.updateOne(1, { genres: [{ name: 'Rock' }] } as any)).rejects.toThrow(
					/has no 'genreId'/
				);
			});
		});

		describe('transactions', () => {
			it('rolls back on failure', async () => {
				await expect(
					albums.withTransaction(async () => {
						await albums.createOne({ title: 'Doomed' });
						throw new Error('nope');
					})
				).rejects.toThrow('nope');

				expect(await albums.find({})).toHaveLength(3);
			});

			it('commits on success', async () => {
				await albums.withTransaction(async () => {
					await albums.createOne({ title: 'Kept' });
				});

				expect(await albums.find({})).toHaveLength(4);
			});
		});

		describe('arrays and JSON', () => {
			it('decodes a delimited array column into a list', async () => {
				const [user] = await users.find({ username: 'kevin' });

				expect(user.roles).toEqual(['admin', 'editor']);
			});

			it('reads an empty column as an empty list, not a list with one empty string', async () => {
				const [user] = await users.find({ username: 'sam' });

				expect(user.roles).toEqual([]);
			});

			it('round trips an array through a write', async () => {
				await users.updateOne('u2', { roles: ['reader', 'writer', 'admin'] } as any);

				expect((await users.findOne({ id: 'u2' }))!.roles).toEqual(['reader', 'writer', 'admin']);
			});

			it('round trips JSON without encoding it twice', async () => {
				// A double encode still stores and reads back without error -- it just comes back
				// as a string containing JSON rather than an object, so assert the shape.
				await users.updateOne('u1', {
					preferences: { theme: 'light', density: { rows: 20 } },
				} as any);

				const user = await users.findOne({ id: 'u1' });

				expect(user!.preferences).toEqual({ theme: 'light', density: { rows: 20 } });
				expect(typeof user!.preferences).toBe('object');
			});

			it('reads the JSON that was seeded', async () => {
				const [user] = await users.find({ username: 'kevin' });

				expect(user.preferences).toEqual({ theme: 'dark' });
			});
		});

		describe('raw queries', () => {
			it('runs a raw query with bound parameters', async () => {
				const rows = await setup.connection.raw<{ title: string }>(
					sql`SELECT title FROM album WHERE album_id = ${2}`
				);

				expect(rows.map((row) => row.title)).toEqual(['OK Computer']);
			});

			it('binds interpolations rather than concatenating them', async () => {
				// If this were concatenated the quote would break the statement, and on a dialect
				// that allows it, far worse. It comes back as no rows instead.
				const rows = await setup.connection.raw(
					sql`SELECT title FROM album WHERE title = ${"'; DROP TABLE album; --"}`
				);

				expect(rows).toHaveLength(0);
				// Still there.
				expect(await albums.find({})).toHaveLength(3);
			});
		});

		describe('relationships through the whole graph', () => {
			it('walks two levels of relationship filter', async () => {
				expect(
					(await tracks.find({ album: { artist: { name: 'Radiohead' } } }))
						.map((r: any) => r.name)
						.sort(byCodeUnit)
				).toEqual(['Karma Police', 'Paranoid Android']);
			});

			it('loads albums by artist through the inverse side', async () => {
				const rows = await artists.find({ albums: { title: 'OK Computer' } });

				expect(rows.map((r: any) => r.name)).toEqual(['Radiohead']);
			});
		});
	});
};
