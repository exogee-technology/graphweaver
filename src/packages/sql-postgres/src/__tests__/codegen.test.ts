import { beforeAll, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { postgresIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import type { DatabaseSchemaIR } from '@exogee/graphweaver-sql/lib/introspection';
import { generateFiles } from '@exogee/graphweaver-sql/lib/codegen';
import { postgres } from '../driver';
import { ddl } from './ddl';

// GUARDED: these need a reachable PostgreSQL. `pnpm compose:up` starts one, or point PGHOST at
// your own. Skipping rather than failing keeps `pnpm -r test` meaningful on a machine without one.
const host = process.env.PGHOST;

if (!host) {
	describe.skip('codegen: postgres (set PGHOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	/**
	 * Generates entity files from the live schema and checks what comes out. Snapshotted, because the
	 * thing that matters about generated code is that it stays the same when the schema does -- a
	 * regenerate that produces a spurious diff is a regenerate nobody runs.
	 */
	describe('codegen from a live postgres schema', () => {
		const connection = defineConnection({
			id: 'codegen-postgres',
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

		const generate = () =>
			generateFiles({
				schema,
				dialect: 'postgres',
				connectionId: 'pg',
				connection: { host: 'localhost', database: 'chinook', user: 'postgres' },
			});

		it('emits one file per entity plus an index and a database file', () => {
			const { files } = generate();

			expect(files.map((file) => file.path).sort()).toEqual([
				'backend/database.ts',
				'backend/schema/album.ts',
				'backend/schema/app-user.ts',
				'backend/schema/artist.ts',
				'backend/schema/genre.ts',
				'backend/schema/index.ts',
				'backend/schema/track.ts',
			]);
		});

		it('emits no errors for a schema it fully understands', () => {
			expect(generate().errors).toEqual([]);
		});

		it('warns before overwriting only the files people hand-edit', () => {
			const { files } = generate();
			const warns = files.filter((file) => file.warnBeforeOverwrite).map((file) => file.path);

			expect(warns.sort()).toEqual(['backend/database.ts', 'backend/schema/index.ts']);
		});

		it('generates an entity per table', () => {
			const { files } = generate();
			const album = files.find((file) => file.path === 'backend/schema/album.ts')!;

			expect(album.contents).toMatchSnapshot();
		});

		it('generates the many-to-many owner with its pivot', () => {
			const { files } = generate();
			const track = files.find((file) => file.path === 'backend/schema/track.ts')!;

			expect(track.contents).toMatchSnapshot();
		});

		it('marks a client-generated primary key on the entity that needs it', () => {
			const { files } = generate();
			const user = files.find((file) => file.path === 'backend/schema/app-user.ts')!;

			expect(user.contents).toContain('apiOptions: { clientGeneratedPrimaryKeys: true }');
			expect(files.find((file) => file.path === 'backend/schema/album.ts')!.contents).not.toContain(
				'clientGeneratedPrimaryKeys'
			);
		});

		it('generates the database file', () => {
			const { files } = generate();

			expect(files.find((file) => file.path === 'backend/database.ts')!.contents).toMatchSnapshot();
		});

		it('leaves out column overrides the naming strategy already produces', () => {
			const { files } = generate();
			const album = files.find((file) => file.path === 'backend/schema/album.ts')!;

			// album_id comes from albumId by convention, so no override is needed for it.
			expect(album.contents).not.toContain("column: 'album_id'");
			// But the foreign key column is always explicit, because it is load bearing.
			expect(album.contents).toContain("column: 'artist_id'");
		});
	});
}
