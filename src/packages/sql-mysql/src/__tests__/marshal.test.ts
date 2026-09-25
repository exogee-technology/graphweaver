import { afterAll, describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '../driver';
import { mysqlMarshaller } from '../marshal';

/**
 * Booleans are TINYINT(1) or BIT(1) in MySQL. mysql2 hands a TINYINT back as a number and a BIT as
 * a Buffer, and both have to read back as the flag that was written.
 */
describe('mysql booleans', () => {
	it('reads a TINYINT(1) by its value', () => {
		expect(mysqlMarshaller.fromDatabase(1, 'boolean')).toBe(true);
		expect(mysqlMarshaller.fromDatabase(0, 'boolean')).toBe(false);
		expect(mysqlMarshaller.fromDatabase('1', 'boolean')).toBe(true);
	});

	it('reads a BIT(1) by its bits', () => {
		expect(mysqlMarshaller.fromDatabase(Buffer.from([1]), 'boolean')).toBe(true);
		expect(mysqlMarshaller.fromDatabase(Buffer.from([0]), 'boolean')).toBe(false);
	});

	it('writes either as a 1 or a 0', () => {
		expect(mysqlMarshaller.toDatabase(true, 'boolean')).toBe(1);
		expect(mysqlMarshaller.toDatabase(false, 'boolean')).toBe(0);
	});
});

const host = process.env.MYSQL_HOST;
const describeWithServer = host ? describe : describe.skip;

describeWithServer('mysql booleans round trip (set MYSQL_HOST to run)', () => {
	const connection = defineConnection({
		id: 'booleans',
		dialect: mysql({
			host: host!,
			port: Number(process.env.MYSQL_PORT ?? 3306),
			user: process.env.MYSQL_USER ?? 'root',
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE ?? 'graphweaver_sql_test',
		}),
	});

	afterAll(async () => {
		await connection.query({ text: 'DROP TABLE IF EXISTS boolean_round_trip', params: [] });
		await connection.close();
	});

	it('reads back what it wrote, in a BIT(1) and a TINYINT(1)', async () => {
		const run = (text: string, params: unknown[] = []) =>
			connection.query<{ bit: unknown; tiny: unknown }>({
				text,
				params: params.map((value) => ({ value, type: 'boolean' }) as never),
			});

		await run('DROP TABLE IF EXISTS boolean_round_trip');
		await run('CREATE TABLE boolean_round_trip (id INT PRIMARY KEY, bit BIT(1), tiny TINYINT(1))');
		await run('INSERT INTO boolean_round_trip VALUES (1, ?, ?), (2, ?, ?)', [
			true,
			true,
			false,
			false,
		]);

		// Both protocols: with no parameters mysql2 uses the text one, with some the binary one.
		const text = await run('SELECT bit, tiny FROM boolean_round_trip ORDER BY id');
		const binary = await connection.query<{ bit: unknown; tiny: unknown }>({
			text: 'SELECT bit, tiny FROM boolean_round_trip WHERE id >= ? ORDER BY id',
			params: [{ value: 0, type: 'int' } as never],
		});

		for (const { rows } of [text, binary]) {
			expect(
				rows.map((row) => [
					mysqlMarshaller.fromDatabase(row.bit, 'boolean'),
					mysqlMarshaller.fromDatabase(row.tiny, 'boolean'),
				])
			).toEqual([
				[true, true],
				[false, false],
			]);
		}
	});
});
