import { describe, expect, it } from 'vitest';
import { Entity, Field, ID, graphweaverMetadata } from '@exogee/graphweaver';
import { defineConnection } from '../connection/connection';
import { sqlite } from '../dialect';
import { clearMappingCache, resolveEntityCached } from '../mapping/registry';
import { SqlDataProvider } from '../provider';

/**
 * An entity carrying `serialize`/`deserialize` statics is a value object, not a table.
 *
 * Core serialises it on the way in and deserialises it on the way out, so the provider only ever
 * sees a plain value bound for one column. The storage provider's `@MediaField` is the case in the
 * tree -- `GraphweaverMedia` is a real `@Entity`, so it gets a GraphQL type of its own, but it is
 * stored in a single `jsonb` column.
 *
 * Classifying it as a relationship instead invents a foreign key: writes went looking for
 * `image_id` against a table whose column is plain `image`, and failed at the database rather than
 * anywhere a type would have caught it.
 *
 * Declared here rather than imported from the storage provider package so the rule is tested, not
 * the one instance of it -- and because this package does not depend on that one.
 */
describe('value object entities are columns, not relationships', () => {
	const setup = () => {
		clearMappingCache();
		graphweaverMetadata.clear();

		const connection = defineConnection({
			id: `value-object-${Math.random()}`,
			dialect: { dialect: sqlite, connect: () => Promise.reject(new Error('not used')) },
		});

		return connection;
	};

	it('maps a serializable entity to a single json column named after the property', () => {
		const connection = setup();

		@Entity('Media', { provider: undefined })
		class Media {
			@Field(() => String)
			filename!: string;

			static serialize = ({ value }: { value: any }) => ({ filename: value.filename });
			static deserialize = ({ value }: { value: unknown }) => value;
		}

		@Entity<Submission>('Submission', {
			provider: new SqlDataProvider(() => Submission, connection),
		})
		class Submission {
			@Field(() => ID, { primaryKeyField: true })
			id!: string;

			@Field(() => Media, { nullable: true })
			image?: Media;
		}

		const resolved = resolveEntityCached(graphweaverMetadata.metadataForType(Submission)!);

		// The foreign key spelling is what actually reached the database, so assert against it
		// directly rather than only asserting the column exists.
		expect(resolved.relationships.has('image')).toBe(false);
		expect([...resolved.relationships.keys()]).toEqual([]);

		const image = resolved.columns.get('image');
		expect(image?.name).toBe('image');
		expect(image?.type).toBe('json');
	});

	it('still treats an ordinary entity reference as a relationship', () => {
		const connection = setup();

		@Entity<Artist>('Artist', { provider: new SqlDataProvider(() => Artist, connection) })
		class Artist {
			@Field(() => ID, { primaryKeyField: true })
			id!: string;
		}

		@Entity<Album>('Album', { provider: new SqlDataProvider(() => Album, connection) })
		class Album {
			@Field(() => ID, { primaryKeyField: true })
			id!: string;

			@Field(() => Artist)
			artist!: Artist;
		}

		const resolved = resolveEntityCached(graphweaverMetadata.metadataForType(Album)!);

		// Without this the first assertion would pass for the wrong reason -- a rule that made
		// every entity-typed field a column would satisfy it just as well.
		const artist = resolved.relationships.get('artist');
		expect(artist?.kind).toBe('manyToOne');
		expect(resolved.columns.has('artist')).toBe(false);
	});
});
