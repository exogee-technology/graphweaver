import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import gql from 'graphql-tag';
import { Database } from 'node-sqlite3-wasm';
import * as GraphweaverServer from '@exogee/graphweaver-server';
import { defineConnection } from '@exogee/graphweaver-sql';
import {
	defineTestEntities,
	SEED_STATEMENTS,
	TABLES_IN_DROP_ORDER,
} from '@exogee/graphweaver-sql/lib/testing';
import { sqlite } from '../driver';
import { ddl } from './ddl';

/**
 * The end to end proof: real GraphQL, resolved by core, served by the SQL provider, against a real
 * database. This is the path that goes through core's dataloaders, which is where the relationship
 * contract actually has to hold.
 */
describe('GraphQL through the SQL provider', () => {
	const database = new Database(':memory:');
	const connection = defineConnection({
		id: 'graphql-sqlite',
		dialect: sqlite.fromDatabase(database),
	});

	defineTestEntities(connection);

	// The server package is CJS with a default export, and under vitest's ESM interop that lands
	// two `default`s deep. Walk down to the constructor rather than guessing at a depth.
	const resolveDefault = (value: unknown): any => {
		let current: any = value;
		while (current && typeof current !== 'function' && 'default' in current) {
			current = current.default;
		}
		return current;
	};

	const Graphweaver = resolveDefault(GraphweaverServer) as new () => {
		executeOperation(request: {
			query: unknown;
			variables?: Record<string, unknown>;
		}): Promise<any>;
	};
	const graphweaver = new Graphweaver();

	beforeAll(() => connection.connect());

	beforeEach(() => {
		for (const table of TABLES_IN_DROP_ORDER) database.exec(`DROP TABLE IF EXISTS ${table}`);
		for (const statement of ddl) database.exec(statement);
		for (const statement of SEED_STATEMENTS) database.exec(statement);
	});

	const run = async <T>(query: any, variables?: Record<string, unknown>) => {
		const response = await graphweaver.executeOperation({ query, variables });

		if (response.body.kind !== 'single') throw new Error('Expected a single result.');
		expect(response.body.singleResult.errors).toBeUndefined();

		return response.body.singleResult.data as T;
	};

	it('serves a list query', async () => {
		const data = await run<{ albums: { title: string }[] }>(gql`
			query {
				albums {
					albumId
					title
				}
			}
		`);

		expect(data.albums.map((album) => album.title)).toEqual([
			'Jagged Little Pill',
			'OK Computer',
			'Orphan Album',
		]);
	});

	it('filters on whether a relationship has any rows', async () => {
		// Through the schema, not just the provider: the filter input has to actually offer
		// `tracks_exists`, or GraphQL rejects the document before anything else gets a say. That is
		// the half a provider level test cannot cover, and the half that was missing -- the rest of
		// the grammar has no way to ask this question, because `_not: { tracks: {} }` is stripped
		// by core's `cleanFilter` on the way in and silently matches everything instead.
		const empty = await run<{ albums: { title: string }[] }>(gql`
			query {
				albums(filter: { tracks_exists: false }) {
					title
				}
			}
		`);

		expect(empty.albums.map((album) => album.title)).toEqual(['Orphan Album']);

		const populated = await run<{ albums: { title: string }[] }>(gql`
			query {
				albums(filter: { tracks_exists: true }) {
					title
				}
			}
		`);

		expect(populated.albums.map((album) => album.title)).toEqual([
			'Jagged Little Pill',
			'OK Computer',
		]);
	});

	it('filters on whether a many-to-one resolves', async () => {
		const data = await run<{ albums: { title: string }[] }>(gql`
			query {
				albums(filter: { artist_exists: false }) {
					title
				}
			}
		`);

		expect(data.albums.map((album) => album.title)).toEqual(['Orphan Album']);
	});

	it('resolves a many-to-one through the dataloader', async () => {
		const data = await run<{ albums: { title: string; artist: { name: string } | null }[] }>(gql`
			query {
				albums {
					title
					artist {
						name
					}
				}
			}
		`);

		expect(data.albums).toEqual([
			{ title: 'Jagged Little Pill', artist: { name: 'Alanis Morissette' } },
			{ title: 'OK Computer', artist: { name: 'Radiohead' } },
			{ title: 'Orphan Album', artist: null },
		]);
	});

	it('resolves a one-to-many through the dataloader', async () => {
		const data = await run<{ artists: { name: string; albums: { title: string }[] }[] }>(gql`
			query {
				artists {
					name
					albums {
						title
					}
				}
			}
		`);

		expect(data.artists).toEqual([
			{ name: 'Alanis Morissette', albums: [{ title: 'Jagged Little Pill' }] },
			{ name: 'Radiohead', albums: [{ title: 'OK Computer' }] },
		]);
	});

	it('resolves a many-to-many through the dataloader', async () => {
		const data = await run<{ genres: { name: string; tracks: { name: string }[] }[] }>(gql`
			query {
				genres {
					name
					tracks {
						name
					}
				}
			}
		`);

		const byGenre = Object.fromEntries(
			data.genres.map((genre) => [genre.name, genre.tracks.map((track) => track.name).sort()])
		);

		expect(byGenre['Rock']).toEqual(['Ironic', 'Paranoid Android', 'You Oughta Know']);
		expect(byGenre['Alternative']).toEqual(['Karma Police', 'Paranoid Android']);
	});

	it('resolves a relationship nested back through itself', async () => {
		// The case that returns nulls if findByRelatedId hydrates stubs onto the relationship
		// field: core treats a stub as already resolved and hands it straight back.
		const data = await run<{
			genres: { name: string; tracks: { name: string; album: { title: string } | null }[] }[];
		}>(gql`
			query {
				genres {
					name
					tracks {
						name
						album {
							title
						}
					}
				}
			}
		`);

		const rock = data.genres.find((genre) => genre.name === 'Rock')!;
		const ironic = rock.tracks.find((track) => track.name === 'Ironic')!;

		expect(ironic.album).toEqual({ title: 'Jagged Little Pill' });
	});

	it('filters through a relationship', async () => {
		const data = await run<{ tracks: { name: string }[] }>(gql`
			query {
				tracks(filter: { album: { artist: { name: "Radiohead" } } }) {
					name
				}
			}
		`);

		expect(data.tracks.map((track) => track.name).sort()).toEqual([
			'Karma Police',
			'Paranoid Android',
		]);
	});

	it('paginates and orders', async () => {
		const data = await run<{ tracks: { name: string }[] }>(gql`
			query {
				tracks(pagination: { orderBy: { name: ASC }, limit: 2, offset: 1 }) {
					name
				}
			}
		`);

		expect(data.tracks.map((track) => track.name)).toEqual(['Karma Police', 'Paranoid Android']);
	});

	it('aggregates', async () => {
		const data = await run<{ tracks_aggregate: { count: number } }>(gql`
			query {
				tracks_aggregate(filter: { genres: { name: "Rock" } }) {
					count
				}
			}
		`);

		expect(data.tracks_aggregate.count).toBe(3);
	});

	it('creates through a mutation', async () => {
		const data = await run<{ createAlbum: { title: string } }>(gql`
			mutation {
				createAlbum(input: { title: "Brand New" }) {
					albumId
					title
				}
			}
		`);

		expect(data.createAlbum.title).toBe('Brand New');
	});

	it('creates with a nested relationship through a mutation', async () => {
		const data = await run<{ createTrack: { name: string; genres: { name: string }[] } }>(gql`
			mutation {
				createTrack(input: { name: "Nested", genres: [{ genreId: 1 }] }) {
					name
					genres {
						name
					}
				}
			}
		`);

		expect(data.createTrack.genres.map((genre) => genre.name)).toEqual(['Rock']);
	});

	it('updates through a mutation', async () => {
		const data = await run<{ updateAlbum: { title: string } }>(gql`
			mutation {
				updateAlbum(input: { albumId: 1, title: "Renamed" }) {
					title
				}
			}
		`);

		expect(data.updateAlbum.title).toBe('Renamed');
	});

	it('deletes through a mutation', async () => {
		const data = await run<{ deleteAlbum: boolean }>(gql`
			mutation {
				deleteAlbum(filter: { albumId: 3 })
			}
		`);

		expect(data.deleteAlbum).toBe(true);
	});

	it('never exposes a hidden column', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					users {
						id
						username
						passwordHash
					}
				}
			`,
		});

		if (response.body.kind !== 'single') throw new Error('Expected a single result.');

		// Not merely absent from the data: the field does not exist in the schema at all.
		expect(response.body.singleResult.errors?.[0]?.message).toMatch(/Cannot query field/);
	});
});
