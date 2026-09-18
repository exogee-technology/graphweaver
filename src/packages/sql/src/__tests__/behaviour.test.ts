import { describe, expect, it } from 'vitest';
import { compile } from '../compile/compiler';
import { defineConnection } from '../connection/connection';
import { mssql, mysql, postgres, sqlite } from '../dialect';
import { UnknownFieldError } from '../mapping/types';
import { planCount, planFind } from '../plan/select';
import { album, track } from './fixtures';

const sqlFor = (...args: Parameters<typeof planFind>) => compile(planFind(...args), postgres).text;

describe('nested relationship filters', () => {
	it('spells "has no tracks" as a negated condition every track satisfies', () => {
		// Not `_not: { tracks: {} }`, which reads better and compiles correctly here but never
		// arrives: core's `cleanFilter` drops empty filter objects on the way in, so through the
		// API that condition disappears entirely and every row matches.
		const sql = sqlFor(album, { _not: { tracks: { trackId_null: false } } });

		expect(sql).toContain('NOT EXISTS (SELECT 1 FROM "track" "s1"');
		expect(sql).toContain('IS NOT NULL');
	});

	it('reads `{ tracks: { <not null column>_null: true } }` literally by default', () => {
		// Which matches nothing, a primary key being what it is. That is the honest reading of
		// what was written, and `_not: { tracks: {} }` above is how to ask the other question.
		const sql = sqlFor(album, { tracks: { trackId_null: true } });

		expect(sql).toContain('EXISTS (SELECT 1 FROM "track" "s1"');
		expect(sql).not.toContain('NOT EXISTS');
		expect(sql).toContain('IS NULL');
	});

	it('negates a to-many relationship as NOT EXISTS, not as a negated join predicate', () => {
		const sql = sqlFor(album, { _not: { tracks: { name: 'x' } } });

		expect(sql).toContain('NOT EXISTS (SELECT 1 FROM "track" "s1"');
		// The whole reason for choosing EXISTS: under a join this would read as "has some track
		// that isn't called x", which is not what the filter says.
		expect(sql).not.toContain('JOIN "track"');
	});

	it('never needs SELECT DISTINCT, because nothing multiplies rows', () => {
		const sql = sqlFor(track, {
			_and: [{ genres: { name: 'Rock' } }, { album: { artist: { name: 'Alanis' } } }],
		});

		expect(sql).not.toContain('DISTINCT');
	});

	it('collapses a many-to-one filtered only on the related primary key to a foreign key test', () => {
		// The shape access control filters and cross-datasource flattening both produce, so it is
		// the hottest path in the system and should not cost a subquery.
		expect(sqlFor(album, { artist: { artistId: 5 } })).toContain('WHERE "t0"."artist_id" = $1');
		expect(sqlFor(album, { artist: { artistId: 5 } })).not.toContain('EXISTS');

		expect(sqlFor(album, { artist: { artistId_in: [5, 6] } })).toContain(
			'WHERE "t0"."artist_id" IN ($1, $2)'
		);
	});

	it('does not collapse when the filter touches anything but the related primary key', () => {
		expect(sqlFor(album, { artist: { name: 'Alanis' } })).toContain('EXISTS');
	});

	it('reads null and empty object on a many-to-one as absence and presence', () => {
		expect(sqlFor(album, { artist: null })).toContain('"t0"."artist_id" IS NULL');
		expect(sqlFor(album, { artist: {} })).toContain('"t0"."artist_id" IS NOT NULL');
	});

	it('refuses a null filter on a to-many, where it would have no clear meaning', () => {
		expect(() => sqlFor(album, { tracks: null })).toThrow(/cannot be null/);
	});
});

describe('operator parsing', () => {
	it('handles field names that contain underscores', () => {
		// MikroORM's gqlToMikro does key.split('_') and takes [0] and [1], which turns
		// released_at_gte into field "released", operator "at". Resolving against the real field
		// list instead is what avoids that.
		const sql = sqlFor(album, { released_at_gte: '2020-01-01' });

		expect(sql).toContain('"t0"."released_at" >= $1');
	});

	it('prefers an exact field name over an operator reading', () => {
		expect(sqlFor(album, { title: 'x' })).toContain('"t0"."title" = $1');
	});

	it('throws a useful error for a field that does not exist', () => {
		expect(() => sqlFor(album, { nope: 1 })).toThrow(UnknownFieldError);
		expect(() => sqlFor(album, { nope: 1 })).toThrow(/Known fields are/);
	});
});

describe('boolean identities', () => {
	// findOne bypasses core's cleanFilter, so these genuinely arrive.
	it('treats an empty _and as true and an empty _or as false', () => {
		expect(sqlFor(album, { _and: [] })).not.toContain('WHERE');
		expect(sqlFor(album, { _or: [] })).toContain('WHERE 1 = 0');
	});

	it('treats an empty _in as matching nothing and an empty _nin as matching everything', () => {
		expect(sqlFor(album, { albumId_in: [] })).toContain('WHERE 1 = 0');
		expect(sqlFor(album, { albumId_nin: [] })).toContain('WHERE 1 = 1');
	});
});

describe('dialect divergence', () => {
	it('uses native ILIKE only on postgres', () => {
		const filter = { name_ilike: '%rock%' };

		expect(compile(planFind(track, filter), postgres).text).toContain('"t0"."name" ILIKE $1');

		for (const dialect of [mysql, sqlite, mssql]) {
			expect(compile(planFind(track, filter), dialect).text).toMatch(/LOWER\(.+?\) LIKE LOWER\(/);
		}
	});

	it('pages SQL Server with OFFSET/FETCH, which the planner always supplies an ORDER BY for', () => {
		const { text } = compile(planFind(album, undefined, { limit: 10, offset: 20 }), mssql);

		expect(text).toContain('ORDER BY');
		expect(text).toContain('OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY');
	});

	it('emits no NULLS ordering for a non-nullable column', () => {
		// The primary key tiebreak is appended to every single query, so an emulated NULLS term
		// here would be wasted work on mysql and mssql, and can stop the sort using an index.
		const { text } = compile(planFind(album, undefined, { limit: 1 }), mssql);

		expect(text).toContain('ORDER BY [t0].[album_id] ASC');
		expect(text).not.toContain('CASE WHEN [t0].[album_id] IS NULL');
	});

	it('still emulates NULLS ordering where the column really is nullable', () => {
		const { text } = compile(planFind(album, undefined, { orderBy: { title: 'DESC' } }), mssql);

		expect(text).toContain('CASE WHEN [t0].[title] IS NULL THEN 1 ELSE 0 END DESC');
	});

	it('counts with COUNT_BIG on SQL Server, which overflows int otherwise', () => {
		expect(compile(planCount(album), mssql).text).toContain('COUNT_BIG(*)');
		expect(compile(planCount(album), postgres).text).toContain('count(*)');
	});
});

describe('bound parameter ceiling', () => {
	it('chunks an IN list that would exceed the dialect limit', () => {
		const { text, params } = compile(planFind(album, { albumId_in: [1, 2, 3, 4, 5] }), postgres, {
			maxInListSize: 2,
		});

		expect(text).toContain(
			'("t0"."album_id" IN ($1, $2) OR "t0"."album_id" IN ($3, $4) OR "t0"."album_id" IN ($5))'
		);
		expect(params).toHaveLength(5);
	});

	it('chunks a NOT IN list with AND, since the row must miss every chunk', () => {
		const { text } = compile(planFind(album, { albumId_nin: [1, 2, 3] }), postgres, {
			maxInListSize: 2,
		});

		expect(text).toContain('("t0"."album_id" NOT IN ($1, $2) AND "t0"."album_id" NOT IN ($3))');
	});

	it('reports a much smaller dataloader batch size for SQL Server', () => {
		// Two short of the documented 2100, because sp_executesql spends two of them on the
		// statement text and the parameter declarations before ours are counted.
		expect(mssql.maxBindParameters).toBe(2098);
		expect(mssql.maxDataLoaderBatchSize).toBeLessThan(postgres.maxDataLoaderBatchSize);
	});
});

describe('parameterisation', () => {
	const NASTY = [
		"'; DROP TABLE album; --",
		'" OR "1"="1',
		'` OR 1=1 --',
		'] OR [1]=[1',
		'\\',
		'%_%',
		String.fromCharCode(0),
		'$1',
		'@p0',
		'?',
	];

	// Rather than searching for the value in the text (which false-positives on '$1' and '@p0'),
	// assert the compiled SQL is byte-identical to a benign compile. If a value could influence
	// the statement at all, these would differ.
	it.each(['postgres', 'mysql', 'sqlite', 'mssql'] as const)(
		'lets no value influence the SQL text on %s',
		(name) => {
			const dialect = { postgres, mysql, sqlite, mssql }[name];
			const benign = compile(planFind(album, { title: 'benign' }), dialect).text;

			for (const value of NASTY) {
				const { text, params } = compile(planFind(album, { title: value }), dialect);

				expect(text).toBe(benign);
				expect(params.map((param) => param.value)).toEqual([value]);
			}
		}
	);

	it('cannot turn a filter key into an identifier', () => {
		expect(() => sqlFor(album, { 'title"; DROP TABLE album; --': 'x' })).toThrow(UnknownFieldError);
	});
});

describe('defineConnection', () => {
	it('refuses a second definition that disagrees with the first', () => {
		// Returning the first connection and dropping the second's options is silent and wrong: a
		// discarded naming strategy does not fail, it reads every table under a different name.
		const dialect = { dialect: postgres, connect: () => Promise.reject(new Error('unused')) };
		const id = `conflict-${Math.random()}`;

		defineConnection({ id, dialect, namingStrategy: 'snakeCase' });

		expect(() => defineConnection({ id, dialect, namingStrategy: 'pascalCase' })).toThrow(
			/already defined with a different configuration/
		);
	});

	it('allows an identical redefinition, which a bundler or a reload can cause', () => {
		const dialect = { dialect: postgres, connect: () => Promise.reject(new Error('unused')) };
		const id = `same-${Math.random()}`;

		const first = defineConnection({ id, dialect, namingStrategy: 'pascalCase' });

		expect(defineConnection({ id, dialect, namingStrategy: 'pascalCase' })).toBe(first);
	});
});

describe('data source display name', () => {
	it('names each dialect the way its vendor spells it', () => {
		// The Admin UI shows this as "From SQLite (275 rows)". Coming from the dialect rather than
		// from generated code means a hand written entity gets it too, and a generated file does
		// not repeat `backendDisplayName` on every entity the way the MikroORM importer did.
		expect(postgres.displayName).toBe('PostgreSQL');
		expect(mysql.displayName).toBe('MySQL');
		expect(sqlite.displayName).toBe('SQLite');
		expect(mssql.displayName).toBe('SQL Server');
	});

	it('lets a connection override it, which is what two Postgres connections need', () => {
		// Two data sources both labelled "PostgreSQL" tell the reader nothing.
		const dialect = { ...postgres, connect: () => Promise.reject(new Error('unused')) };

		const named = defineConnection({
			id: `named-${Math.random()}`,
			dialect,
			displayName: 'Reporting Warehouse',
		});

		expect(named.displayName).toBe('Reporting Warehouse');
		expect(
			defineConnection({ id: `unnamed-${Math.random()}`, dialect }).displayName
		).toBeUndefined();
	});
});
