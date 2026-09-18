import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { runConformanceSuite } from '@exogee/graphweaver-sql/lib/testing';
import { mysql } from '../driver';
import { afterSeed, ddl } from './ddl';

/**
 * Runs wherever a MySQL is reachable, and skips otherwise, so the suite is useful locally without
 * being a hard requirement. CI sets MYSQL_HOST.
 */
const host = process.env.MYSQL_HOST;

if (!host) {
	describe.skip('conformance: mysql (set MYSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	const connection = defineConnection({
		id: 'conformance-mysql',
		dialect: mysql({
			host,
			port: Number(process.env.MYSQL_PORT ?? 3306),
			user: process.env.MYSQL_USER ?? 'root',
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE ?? 'graphweaver_sql_test',
		}),
	});

	runConformanceSuite({
		hooks: { describe, it, beforeAll, beforeEach, expect },
		name: 'mysql',
		connection,
		ddl,
		exactDecimals: true,
		afterSeed,
		raw: async (sql) => {
			const { rows } = await connection.query({ text: sql, params: [] });
			return rows as Record<string, unknown>[];
		},
	});
}
