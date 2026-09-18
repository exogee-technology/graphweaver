import { describe, expect, it } from 'vitest';
import { Entity, Field, ID, graphweaverMetadata } from '@exogee/graphweaver';
import { defineConnection } from '../connection/connection';
import { sqlite } from '../dialect';
import { ManyToOne, OneToMany } from '../decorators';
import { clearMappingCache } from '../mapping/registry';
import { SqlDataProvider } from '../provider';

/**
 * The registry decides which table an entity reads from, and it memoises. Getting the order wrong
 * bakes in an answer nobody asked for, and because the columns still resolve correctly the
 * generated SQL looks entirely plausible -- right column list, wrong table.
 */
describe('mapping options and resolution order', () => {
	it('honours a table override even when a related entity resolves first', () => {
		clearMappingCache();
		graphweaverMetadata.clear();

		// Never connected: resolution is pure mapping, and opening a database would only make this
		// test slower and less specific.
		const connection = defineConnection({
			id: `registry-${Math.random()}`,
			dialect: { dialect: sqlite, connect: () => Promise.reject(new Error('not used')) },
		});

		@Entity<Artist>('Artist', {
			provider: new SqlDataProvider(() => Artist, connection, { table: 'Artist' }),
		})
		class Artist {
			@Field(() => ID, { primaryKeyField: true })
			artistId!: number;

			@OneToMany(() => [Album], { relatedField: 'artist' })
			albums!: Album[];
		}

		@Entity<Album>('Album', {
			provider: new SqlDataProvider(() => Album, connection, { table: 'Album' }),
		})
		class Album {
			@Field(() => ID, { primaryKeyField: true })
			albumId!: number;

			@ManyToOne(() => Artist, { column: 'ArtistId' })
			artist!: Artist;
		}

		const albumProvider = graphweaverMetadata.getEntityByName('Album')!
			.provider as SqlDataProvider<Album>;
		const artistProvider = graphweaverMetadata.getEntityByName('Artist')!
			.provider as SqlDataProvider<Artist>;

		// Album first, and Album's mapping resolves Artist as its relationship target. Artist's own
		// provider has not been touched at this point, which is exactly the case that used to cache
		// Artist with no options at all -- sending every Artist query to whatever the naming
		// strategy invented, here `artist`, which does not exist.
		//
		// Which class is *declared* first is a separate matter and not what is under test:
		// `emitDecoratorMetadata` emits an eager `design:type` reference, so a decorated property
		// whose type is declared later in the same module is a TDZ error. Real entities live one
		// per module, so this only ever bites a test that declares both together.
		expect(albumProvider.mapping.table).toBe('Album');
		expect(albumProvider.mapping.relationships.get('artist')!.target().table).toBe('Artist');
		expect(artistProvider.mapping.table).toBe('Artist');
	});
});
