import { beforeAll, describe, expect, it } from 'vitest';
import { Database } from 'node-sqlite3-wasm';
import { snakeCase } from '@exogee/graphweaver-sql';
import { buildEntityModels, sqliteIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { runIntrospectionSuite } from '@exogee/graphweaver-sql/lib/testing';
import type { DatabaseSchemaIR } from '@exogee/graphweaver-sql/lib/introspection';
import { ddl } from './ddl';

/**
 * SQLite has no information_schema, so this reads sqlite_master plus PRAGMAs. It also has the most
 * normalisation traps of the four: `pk` is a position rather than a flag, a foreign key's target
 * column is null when it is implicitly the primary key, and AUTOINCREMENT appears nowhere except
 * the original CREATE statement.
 */
describe('sqlite introspection', () => {
	const database = new Database(':memory:');
	let schema: DatabaseSchemaIR;

	beforeAll(async () => {
		for (const statement of ddl) database.exec(statement);

		schema = await sqliteIntrospector.introspect(
			async (sql) => database.all(sql) as Record<string, unknown>[]
		);
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

	it('reads the primary key from the position, not a boolean', () => {
		expect(schema.tables.find((t) => t.name === 'album')!.primaryKey!.columns).toEqual([
			'album_id',
		]);
		expect(schema.tables.find((t) => t.name === 'track_genre')!.primaryKey!.columns).toEqual([
			'track_id',
			'genre_id',
		]);
	});

	it('treats an INTEGER PRIMARY KEY as generated, since it aliases rowid', () => {
		const album = schema.tables.find((table) => table.name === 'album')!;

		expect(album.columns.find((c) => c.name === 'album_id')!.autoIncrement).toBe(true);
	});

	it('does not treat a text primary key as generated', () => {
		const user = schema.tables.find((table) => table.name === 'app_user')!;

		expect(user.columns.find((c) => c.name === 'id')!.autoIncrement).toBe(false);
	});

	it('resolves a foreign key target that PRAGMA reports as null', () => {
		const album = schema.tables.find((table) => table.name === 'album')!;

		expect(album.foreignKeys[0]).toMatchObject({
			columns: ['artist_id'],
			referencedTable: 'artist',
			referencedColumns: ['artist_id'],
		});
	});

	it('reads nullability, with the primary key never nullable', () => {
		const album = schema.tables.find((table) => table.name === 'album')!;

		expect(album.columns.find((c) => c.name === 'album_id')!.nullable).toBe(false);
		expect(album.columns.find((c) => c.name === 'title')!.nullable).toBe(false);
		expect(album.columns.find((c) => c.name === 'artist_id')!.nullable).toBe(true);
	});

	it('maps declared types through SQLite affinity rules', () => {
		const { entities } = buildEntityModels(schema, snakeCase);
		const track = entities.find((entity) => entity.name === 'Track')!;

		expect(track.properties.find((p) => p.property === 'name')!.type).toBe('string');
		expect(track.properties.find((p) => p.property === 'milliseconds')!.type).toBe('int');
	});

	it('builds the same entity shape Postgres does', () => {
		const { entities, errors } = buildEntityModels(schema, snakeCase);

		expect(errors).toEqual([]);
		expect(entities.map((entity) => entity.name).sort()).toEqual([
			'Album',
			'AppUser',
			'Artist',
			'Genre',
			'Track',
		]);

		const album = entities.find((entity) => entity.name === 'Album')!;
		expect(album.relationships).toContainEqual(
			expect.objectContaining({ kind: 'manyToOne', property: 'artist', column: 'artist_id' })
		);

		const track = entities.find((entity) => entity.name === 'Track')!;
		expect(track.relationships.some((r) => r.kind === 'manyToMany')).toBe(true);
	});
});

const sharedDatabase = new Database(':memory:');

runIntrospectionSuite({
	hooks: { describe, it, beforeAll, beforeEach: () => undefined, expect },
	name: 'sqlite',
	introspector: sqliteIntrospector,
	setUp: async () => {
		for (const statement of ddl) sharedDatabase.exec(statement);
	},
	query: async (sql) => sharedDatabase.all(sql) as Record<string, unknown>[],
});
