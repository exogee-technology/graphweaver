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
