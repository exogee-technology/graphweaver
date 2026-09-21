import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { defineConnection, sql } from '@exogee/graphweaver-sql';
import { mssql } from '../driver';

/**
 * Decimal has to survive the trip, and on SQL Server it very nearly did not.
 *
 * tedious defaults a `TYPES.Decimal` parameter to scale 0, so declaring the type -- which is what
 * `@Field(() => String, { columnType: 'decimal' })` does -- rounded the value to an integer on the
 * way in. Nothing failed: the insert succeeded and the column read back a whole number.
 *
 * The three other dialects all send decimals as text for the same reason a double cannot hold what
 * a numeric column can, so this asserts SQL Server now agrees with them.
 */
const host = process.env.MSSQL_HOST;

if (!host) {
	describe.skip('decimal: mssql (set MSSQL_HOST to run)', () => {
		it('skipped', () => undefined);
	});
} else {
	describe('decimal round trip', () => {
		const connection = defineConnection({
			id: 'decimal-mssql',
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

		beforeAll(async () => {
			await connection.raw(
				sql`IF OBJECT_ID('dbo.decimal_probe') IS NOT NULL DROP TABLE dbo.decimal_probe`
			);
			// Scale 4 is the point: tedious's default of 0 is what silently truncated it.
			await connection.raw(sql`CREATE TABLE dbo.decimal_probe (id INT NOT NULL, v DECIMAL(19, 4) NOT NULL)`);
		});

		// Every file in this package introspects the same database, and one of them asserts the
		// exact set of tables in it -- so a probe table that outlives this file fails a test in
		// another one.
		afterAll(async () => {
			await connection.raw(
				sql`IF OBJECT_ID('dbo.decimal_probe') IS NOT NULL DROP TABLE dbo.decimal_probe`
			);
		});

		const write = async (id: number, value: string, type: 'decimal' | 'string') => {
			await connection.query({
				text: 'INSERT INTO dbo.decimal_probe (id, v) VALUES (@p0, @p1)',
				params: [
					{ value: id, type: 'int' },
					{ value, type },
				],
			} as never);

			const rows = await connection.raw<{ v: unknown }>(
				sql`SELECT v FROM dbo.decimal_probe WHERE id = ${id}`
			);
			return String(rows[0].v);
		};

		it('keeps the fractional part of a declared decimal parameter', async () => {
			expect(await write(1, '1234.5678', 'decimal')).toBe('1234.5678');
		});

		it('stores precision a double could not hold', async () => {
			// 19 significant digits, past what a JS number can represent. Asserted against the
			// server's own text rather than the value tedious returns, because those differ: the
			// write is exact, and tedious then parses DECIMAL into a JS double on the way back, so
			// it hands this one back as 123456789012345.67.
			//
			// That read side loss is tedious's, upstream of anything this package does -- the value
			// is already a number before `fromDatabase` sees it -- and it is particular to SQL
			// Server. pg and mysql2 are both configured to return numerics as strings, and SQLite
			// stores them as text. Fixing it means casting decimal columns to text in the SELECT
			// list, which is a compiler change, not a marshaller one.
			await write(2, '123456789012345.6789', 'decimal');

			const rows = await connection.raw<{ stored: string }>(
				sql`SELECT CAST(v AS NVARCHAR(64)) AS stored FROM dbo.decimal_probe WHERE id = 2`
			);
			expect(rows[0].stored).toBe('123456789012345.6789');
		});

		it('matches what an undeclared column type already did', async () => {
			// Generated entities take this path -- codegen maps a decimal column to GraphQL String
			// and emits no `columnType` -- so the two must not disagree.
			expect(await write(3, '1234.5678', 'string')).toBe('1234.5678');
		});

		it('compares correctly in a WHERE clause', async () => {
			// nvarchar converts to decimal rather than the other way around, so a parameter bound
			// as text still filters on the column's own type.
			const rows = await connection.raw<{ id: number }>(
				sql`SELECT id FROM dbo.decimal_probe WHERE v > ${'1000.0000'} ORDER BY id`
			);
			expect(rows.map((row) => row.id)).toEqual([1, 2, 3]);
		});
	});
}
