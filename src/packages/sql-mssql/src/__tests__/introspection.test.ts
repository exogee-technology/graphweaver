import { beforeAll, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mssqlIntrospector } from '@exogee/graphweaver-sql/lib/introspection';
import { runIntrospectionSuite } from '@exogee/graphweaver-sql/lib/testing';
import { mssql } from '../driver';
import { ddl } from './ddl';

const host = process.env.MSSQL_HOST;

if (!host) {
	describe.skip('introspection: mssql (set MSSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	const connection = defineConnection({
		id: 'introspection-mssql',
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

	const raw = async (sql: string) => {
		const { rows } = await connection.query({ text: sql, params: [] });
		return rows as Record<string, unknown>[];
	};

	runIntrospectionSuite({
		hooks: { describe, it, beforeAll, beforeEach: () => undefined, expect },
		name: 'mssql',
		introspector: mssqlIntrospector,
		setUp: async () => {
			await connection.connect();
			// Drop children before parents: SQL Server will not drop a referenced table.
			for (const table of ['track_genre', 'track', 'album', 'artist', 'genre', 'app_user']) {
				await raw(`IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE ${table}`);
			}
			for (const statement of ddl) await raw(statement);
		},
		query: async (sql) => raw(sql),
	});
}
