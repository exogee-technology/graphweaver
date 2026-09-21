import { beforeAll, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mysqlIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { runIntrospectionSuite } from '@exogee/graphweaver-sql/lib/testing';
import { mysql } from '../driver';
import { ddl } from './ddl';

const host = process.env.MYSQL_HOST;

if (!host) {
	describe.skip('introspection: mysql (set MYSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	const connection = defineConnection({
		id: 'introspection-mysql',
		dialect: mysql({
			host,
			port: Number(process.env.MYSQL_PORT ?? 3306),
			user: process.env.MYSQL_USER ?? 'root',
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE ?? 'graphweaver_sql_test',
		}),
	});

	const raw = async (sql: string) => {
		const { rows } = await connection.query({ text: sql, params: [] });
		return rows as Record<string, unknown>[];
	};

	runIntrospectionSuite({
		hooks: { describe, it, beforeAll, beforeEach: () => undefined, expect },
		name: 'mysql',
		introspector: mysqlIntrospector,
		setUp: async () => {
			await connection.connect();
			await raw('SET FOREIGN_KEY_CHECKS = 0');
			for (const table of ['track_genre', 'track', 'album', 'artist', 'genre', 'app_user']) {
				await raw(`DROP TABLE IF EXISTS ${table}`);
			}
			await raw('SET FOREIGN_KEY_CHECKS = 1');
			for (const statement of ddl) await raw(statement);
		},
		query: async (sql) => raw(sql),
	});
}
