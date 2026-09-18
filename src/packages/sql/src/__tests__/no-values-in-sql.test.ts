import { describe, expect, it } from 'vitest';
import { compile } from '../compile/compiler';
import { mssql, mysql, postgres, sqlite } from '../dialect';
import { planFind } from '../plan/select';
import { sql } from '../connection/raw';
import { album, track } from './fixtures';

/**
 * A bound value must never reach the SQL text.
 *
 * Two things rest on this. The obvious one is injection: a value that stays a parameter cannot
 * change the shape of a statement. The less obvious one is that `SqlConnection.query` traces the
 * statement text, so anything that leaked into it would be written to the log -- which is what a
 * password hash or an API key secret must never do. CodeQL flags that logging line, so this is the
 * assertion that says why it is safe.
 */
const SECRET = "s3cr3t-'value";

describe('bound values never appear in SQL text', () => {
	const dialects = { postgres, mysql, sqlite, mssql };

	for (const [name, dialect] of Object.entries(dialects)) {
		it(`keeps values out of the text on ${name}`, () => {
			const { text, params } = compile(
				planFind(album, {
					title: SECRET,
					_or: [{ title_like: SECRET }, { title_in: [SECRET, 'other'] }],
					tracks: { name_ne: SECRET },
				}),
				dialect
			);

			expect(text).not.toContain(SECRET);
			// And it did not simply get dropped: it is in the parameters, more than once.
			expect(params.filter((param) => param.value === SECRET).length).toBeGreaterThan(2);
		});
	}

	it('keeps them out of a raw query too, which is the one place a caller writes SQL', () => {
		// Interleaving happens in `SqlConnection.raw`; this mirrors it without needing a database.
		const query = sql`SELECT id FROM submission WHERE filename = ${SECRET}`;
		const params = query.values.map((value) => ({ value, type: 'unknown' as const }));

		const text = query.strings.reduce(
			(accumulated, part, index) =>
				index === 0
					? part
					: `${accumulated}${postgres.placeholder(index - 1, params[index - 1])}${part}`,
			''
		);

		expect(text).not.toContain(SECRET);
		expect(text).toContain('$1');
		expect(params[0].value).toBe(SECRET);
	});

	it('keeps them out of a write, where the values are the point', () => {
		const { text, params } = compile(
			{
				kind: 'insert',
				into: { schema: undefined, name: 'track', alias: 't0' },
				columns: ['name'],
				rows: [[{ kind: 'param', value: SECRET, type: 'string' }]],
				returning: ['track_id'],
			},
			postgres
		);

		expect(text).not.toContain(SECRET);
		expect(params.map((param) => param.value)).toEqual([SECRET]);
		void track;
	});
});
