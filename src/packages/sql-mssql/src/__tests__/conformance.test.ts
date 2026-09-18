import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { runConformanceSuite } from '@exogee/graphweaver-sql/lib/testing';
import { mssql } from '../driver';
import { ddl, wrapSeed } from './ddl';

/**
 * Runs wherever a SQL Server is reachable, and skips otherwise. CI sets MSSQL_HOST.
 *
 * This is the dialect with the most divergence and, until now, no coverage at all -- the MikroORM
 * provider has never had an end to end SQL Server test either.
 */
const host = process.env.MSSQL_HOST;

if (!host) {
	describe.skip('conformance: mssql (set MSSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	const connection = defineConnection({
		id: 'conformance-mssql',
		dialect: mssql({
			server: host,
			port: Number(process.env.MSSQL_PORT ?? 1433),
			user: process.env.MSSQL_USER ?? 'sa',
			password: process.env.MSSQL_PASSWORD,
			database: process.env.MSSQL_DATABASE ?? 'graphweaver_sql_test',
			encrypt: false,
			trustServerCertificate: true,
		}),
	});

	runConformanceSuite({
		hooks: { describe, it, beforeAll, beforeEach, expect },
		name: 'mssql',
		connection,
		ddl,
		wrapSeed,
		raw: async (sql) => {
			const { rows } = await connection.query({ text: sql, params: [] });
			return rows as Record<string, unknown>[];
		},
	});
}
