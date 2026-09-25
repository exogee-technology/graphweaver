import { describe, expect, it } from 'vitest';
import { columnTypeForSqlType } from '../introspection/sql-types';

/**
 * SQLite stores no types, only affinities, and its affinity rules are not a guide to what a column
 * is for: `DATETIME` contains none of INT, CHAR, CLOB, TEXT, BLOB, REAL, FLOA or DOUB, so by
 * affinity it is NUMERIC. Reading it that way turned Chinook's `InvoiceDate` into a `number` in
 * generated code, which cost the Admin UI its date filter -- a failure that surfaced three layers
 * away, in a Playwright test looking for a date picker.
 */
describe('sqlite column types', () => {
	const cases: [string, string][] = [
		['DATETIME', 'datetime'],
		['TIMESTAMP', 'datetime'],
		['DATE', 'date'],
		['TIME', 'time'],
		// The text spellings people also use, which must not regress to string.
		['DATETIME TEXT', 'datetime'],
		['INTEGER', 'int'],
		['BIGINT', 'bigint'],
		['NVARCHAR(160)', 'string'],
		['TEXT', 'string'],
		['NUMERIC(10,2)', 'decimal'],
		['REAL', 'float'],
		['BLOB', 'binary'],
		['BOOLEAN', 'boolean'],
	];

	for (const [declared, expected] of cases) {
		it(`reads ${declared} as ${expected}`, () => {
			expect(
				columnTypeForSqlType('sqlite', {
					name: 'c',
					dataType: declared,
					fullType: declared,
				} as never)
			).toBe(expected);
		});
	}
});

/**
 * MySQL has no boolean type. It spells one TINYINT(1) or BIT(1), and both have to come out as
 * boolean -- BIT(1) especially, since its values arrive as a Buffer that, read as binary, a client
 * gets back as bytes rather than a flag.
 */
describe('mysql column types', () => {
	const cases: [dataType: string, fullType: string, expected: string][] = [
		['tinyint', 'tinyint(1)', 'boolean'],
		['bit', 'bit(1)', 'boolean'],
		// A wider BIT is a bit field, not a flag.
		['bit', 'bit(8)', 'binary'],
		['tinyint', 'tinyint', 'int'],
		['tinyint', 'tinyint(4)', 'int'],
	];

	for (const [dataType, fullType, expected] of cases) {
		it(`reads ${fullType} as ${expected}`, () => {
			expect(columnTypeForSqlType('mysql', { name: 'c', dataType, fullType } as never)).toBe(
				expected
			);
		});
	}
});
