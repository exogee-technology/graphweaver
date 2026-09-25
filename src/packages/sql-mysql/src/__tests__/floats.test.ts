import { afterAll, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '../driver';

const host = process.env.MYSQL_HOST;

/**
 * mysql2 parses FLOAT and DOUBLE from the text protocol itself, digit by digit, and gets about one
 * double in seven a unit or so in the last place wrong. A statement without parameters goes over
 * the text protocol, so the driver reads those columns itself; this holds it to the doubles MySQL
 * stored, both ways a statement can go.
 */
const describeWithServer = host ? describe : describe.skip;

describeWithServer('mysql floats (set MYSQL_HOST to run)', () => {
	const connection = defineConnection({
		id: 'floats',
		dialect: mysql({
			host: host!,
			port: Number(process.env.MYSQL_PORT ?? 3306),
			user: process.env.MYSQL_USER ?? 'root',
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE ?? 'graphweaver_sql_test',
		}),
	});

	afterAll(() => connection.close());

	// Each of these came back wrong before; the rest are the awkward ones.
	const doubles = [
		0.9361949725164572, 8.237077243076974e-21, 0.027164950780680156, 2.2488531089054427e29,
		123456789012345680000, 0.1, 0.30000000000000004, 1e21, 1e-7, 5e-324, 1.7976931348623157e308,
		-2.5, 0,
	];

	const table = `JSON_TABLE(?, '$[*]' COLUMNS (i INT PATH '$[0]', x DOUBLE PATH '$[1]')) t`;
	const literal = JSON.stringify(doubles.map((x, i) => [i, x.toPrecision(17)]));

	it('reads doubles exactly over the text protocol', async () => {
		const { rows } = await connection.query<{ i: number; x: number }>({
			text: `SELECT i, x FROM ${table.replace('?', `'${literal}'`)} ORDER BY i`,
			params: [],
		});
		expect(rows.map((row) => row.x)).toEqual(doubles);
	});

	it('reads doubles exactly over the binary protocol', async () => {
		const { rows } = await connection.query<{ i: number; x: number }>({
			text: `SELECT i, x FROM ${table} ORDER BY i`,
			params: [{ value: literal, type: 'string' } as any],
		});
		expect(rows.map((row) => row.x)).toEqual(doubles);
	});

	it('still reads a null as null', async () => {
		const { rows } = await connection.query<{ x: number | null }>({
			text: 'SELECT CAST(NULL AS DOUBLE) AS x',
			params: [],
		});
		expect(rows[0].x).toBeNull();
	});
});
