import { snakeCase } from '../mapping/naming';
import { buildEntityModels } from '../introspection/entity-model';
import type {
	DatabaseSchemaIR,
	IntrospectionQuery,
	SchemaIntrospector,
} from '../introspection/schema-ir';
import type { TestHooks } from './conformance';

export interface IntrospectionSuiteSetup {
	hooks: TestHooks;
	name: string;
	introspector: SchemaIntrospector;
	/** Creates the schema. Run before introspecting. */
	setUp(): Promise<void>;
	query: IntrospectionQuery;
	/** Tables whose primary key the database generates. SQLite aliases rowid, the rest use identity. */
	expectAutoIncrement?: boolean;
}

/**
 * The assertions every introspector has to satisfy, against the same schema the conformance suite
 * uses. Dialect-specific catalog quirks are the implementation's problem; the entity model that
 * comes out the far end should be identical everywhere.
 */
export const runIntrospectionSuite = (setup: IntrospectionSuiteSetup) => {
	const { describe, it, beforeAll, expect } = setup.hooks;

	describe(`introspection: ${setup.name}`, () => {
		let schema: DatabaseSchemaIR;

		beforeAll(async () => {
			await setup.setUp();
			schema = await setup.introspector.introspect(setup.query);
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

		it('reads columns in order', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.columns.map((column) => column.name)).toEqual([
				'album_id',
				'title',
				'artist_id',
			]);
		});

		it('reads nullability', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.columns.find((c) => c.name === 'title')!.nullable).toBe(false);
			expect(album.columns.find((c) => c.name === 'artist_id')!.nullable).toBe(true);
		});

		it('spots the generated primary key', () => {
			const album = schema.tables.find((table) => table.name === 'album')!;

			expect(album.columns.find((c) => c.name === 'album_id')!.autoIncrement).toBe(true);
			// A text key with no default is the client's to supply.
			const user = schema.tables.find((table) => table.name === 'app_user')!;
			expect(user.columns.find((c) => c.name === 'id')!.autoIncrement).toBe(false);
		});

		it('reads primary keys, including the pivot composite', () => {
			expect(schema.tables.find((t) => t.name === 'album')!.primaryKey!.columns).toEqual([
				'album_id',
			]);
			expect(
				[...schema.tables.find((t) => t.name === 'track_genre')!.primaryKey!.columns].sort()
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
			it('names entities in the singular and skips the pivot', () => {
				const { entities, errors } = buildEntityModels(schema, snakeCase);

				expect(errors).toEqual([]);
				expect(entities.map((entity) => entity.name).sort()).toEqual([
					'Album',
					'AppUser',
					'Artist',
					'Genre',
					'Track',
				]);
			});

			it('builds a many-to-one and synthesises its inverse', () => {
				const { entities } = buildEntityModels(schema, snakeCase);

				expect(entities.find((e) => e.name === 'Album')!.relationships).toContainEqual(
					expect.objectContaining({ kind: 'manyToOne', property: 'artist', column: 'artist_id' })
				);
				expect(entities.find((e) => e.name === 'Artist')!.relationships).toContainEqual(
					expect.objectContaining({ kind: 'oneToMany', property: 'albums', relatedField: 'artist' })
				);
			});

			it('builds a many-to-many on both sides with exactly one owner', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const onTrack = entities
					.find((e) => e.name === 'Track')!
					.relationships.find((r) => r.kind === 'manyToMany') as any;
				const onGenre = entities
					.find((e) => e.name === 'Genre')!
					.relationships.find((r) => r.kind === 'manyToMany') as any;

				expect(onTrack).toMatchObject({ property: 'genres', relatedField: 'tracks' });
				expect(onGenre).toMatchObject({ property: 'tracks', relatedField: 'genres' });
				expect([onTrack.owning, onGenre.owning].filter(Boolean)).toHaveLength(1);
			});

			it('does not also emit the foreign key column as a scalar', () => {
				const { entities } = buildEntityModels(schema, snakeCase);

				expect(entities.find((e) => e.name === 'Album')!.properties.map((p) => p.property)).toEqual(
					['albumId', 'title']
				);
			});

			it('marks the client-generated primary key', () => {
				const { entities } = buildEntityModels(schema, snakeCase);

				expect(entities.find((e) => e.name === 'AppUser')!.clientGeneratedPrimaryKeys).toBe(true);
				expect(entities.find((e) => e.name === 'Album')!.clientGeneratedPrimaryKeys).toBe(false);
			});

			it('maps SQL types onto the column vocabulary', () => {
				const { entities } = buildEntityModels(schema, snakeCase);
				const track = entities.find((e) => e.name === 'Track')!;

				expect(track.properties.find((p) => p.property === 'milliseconds')!.type).toBe('int');
				expect(['string', 'text']).toContain(
					track.properties.find((p) => p.property === 'name')!.type
				);
			});
		});
	});
};
