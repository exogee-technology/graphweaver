import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as GraphweaverServer from '@exogee/graphweaver-server';
import { mssqlIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { generateFiles } from '@exogee/graphweaver-sql/lib/codegen';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mssql } from '../driver';

/**
 * The whole import path against the real Chinook database: read the schema, generate entities,
 * write them, import them, and serve GraphQL through them.
 *
 * SQL Server is worth doing this on specifically -- it is the dialect where the most goes
 * differently, and it is the one the end to end workflow had no coverage for at all before.
 */
const host = process.env.MSSQL_HOST;

if (!host) {
	describe.skip('chinook round trip: mssql (set MSSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	describe('chinook round trip: mssql', () => {
		const generatedDir = join(__dirname, '.generated');

		// A different id from the one the generated code declares. Sharing it would mean this
		// connection's options win and the generated file's naming strategy is silently dropped,
		// which is exactly the confusion `defineConnection` now refuses.
		const connection = defineConnection({
			id: 'chinook-introspection',
			dialect: mssql({
				server: host,
				port: Number(process.env.MSSQL_PORT ?? 1433),
				user: process.env.MSSQL_USER ?? 'sa',
				password: process.env.MSSQL_PASSWORD,
				database: 'Chinook',
				encrypt: false,
				trustServerCertificate: true,
			}),
		});

		let albums: { title: string; artist: { name: string } | null }[];
		let trackCount: number;
		let playlists: { name: string; tracks: { name: string }[] }[];

		beforeAll(async () => {
			rmSync(generatedDir, { recursive: true, force: true });
			mkdirSync(generatedDir, { recursive: true });

			await connection.connect();

			const schema = await mssqlIntrospector.introspect(async (sql) => {
				const { rows } = await connection.query({ text: sql, params: [] });
				return rows as Record<string, unknown>[];
			});

			const { files, errors } = generateFiles({
				schema,
				dialect: 'mssql',
				connectionId: 'chinook',
				connection: {
					server: host,
					port: Number(process.env.MSSQL_PORT ?? 1433),
					user: process.env.MSSQL_USER ?? 'sa',
					password: process.env.MSSQL_PASSWORD,
					database: 'Chinook',
					encrypt: false,
					trustServerCertificate: true,
				},
			});

			expect(errors).toEqual([]);

			for (const file of files) {
				const target = join(generatedDir, file.path);
				mkdirSync(dirname(target), { recursive: true });
				writeFileSync(target, file.contents);
			}

			await import('./.generated/backend/schema/index');
			const generated = await import('./.generated/backend/database');
			await generated.connection.connect();

			const resolveDefault = (value: unknown): any => {
				let current: any = value;
				while (current && typeof current !== 'function' && 'default' in current) {
					current = current.default;
				}
				return current;
			};

			const Graphweaver = resolveDefault(GraphweaverServer) as new () => {
				executeOperation(request: { query: unknown }): Promise<any>;
			};
			const graphweaver = new Graphweaver();

			const run = async (query: string) => {
				const response = await graphweaver.executeOperation({ query });
				expect(response.body.singleResult.errors).toBeUndefined();
				return response.body.singleResult.data;
			};

			albums = (
				await run(
					'{ albums(pagination: { limit: 3, orderBy: { albumId: ASC } }) { title artist { name } } }'
				)
			).albums;

			trackCount = (await run('{ tracks_aggregate { count } }')).tracks_aggregate.count;

			// Playlist to Track is the many-to-many in Chinook, across the PlaylistTrack pivot.
			// Genre to Track is a plain foreign key, so it would not exercise the pivot at all.
			playlists = (
				await run('{ playlists(filter: { name: "Music Videos" }) { name tracks { name } } }')
			).playlists;

			// Introspecting the whole of Chinook, generating twelve entity files, importing them and
			// building a schema is a lot for one hook, and vitest allows it ten seconds by default.
			// That is enough on a warm laptop and not on a cold CI runner.
		}, 120_000);

		it('serves rows from a real database through generated entities', () => {
			expect(albums).toHaveLength(3);
			expect(albums[0].title).toBe('For Those About To Rock We Salute You');
		});

		it('resolves a many-to-one through the dataloader', () => {
			expect(albums[0].artist).toEqual({ name: 'AC/DC' });
		});

		it('aggregates the whole table', () => {
			// Chinook's canonical track count.
			expect(trackCount).toBe(3503);
		});

		it('resolves a many-to-many across the generated pivot', () => {
			expect(playlists).toHaveLength(1);
			expect(playlists[0].tracks.map((track) => track.name)).toEqual([
				'Band Members Discuss Tracks from "Revelations"',
			]);
		});
	});
}
