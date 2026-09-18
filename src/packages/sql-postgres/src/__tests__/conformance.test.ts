import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { runConformanceSuite } from '@exogee/graphweaver-sql/lib/testing';
import { postgres } from '../driver';
import { afterSeed, ddl } from './ddl';

// GUARDED: these need a reachable PostgreSQL. `pnpm compose:up` starts one, or point PGHOST at
// your own. Skipping rather than failing keeps `pnpm -r test` meaningful on a machine without one.
const host = process.env.PGHOST;

if (!host) {
	describe.skip('conformance: postgres (set PGHOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	const connection = defineConnection({
		id: 'conformance-postgres',
		dialect: postgres({
			host: host!,
			port: Number(process.env.PGPORT ?? 5432),
			user: process.env.PGUSER ?? 'postgres',
			password: process.env.PGPASSWORD,
			database: process.env.PGDATABASE ?? 'graphweaver_sql_test',
		}),
	});

	runConformanceSuite({
		hooks: { describe, it, beforeAll, beforeEach, expect },
		name: 'postgres',
		connection,
		ddl,
		afterSeed,
		raw: async (sql) => {
			const { rows } = await connection.query({ text: sql, params: [] });
			return rows as Record<string, unknown>[];
		},
	});
}
