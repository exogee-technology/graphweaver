import { describe, expect, it } from 'vitest';
import { compile } from '../compile/compiler';
import { allDialects } from '../dialect';
import type { DialectName } from '../dialect/dialect';
import { planFind } from '../plan/select';
import { album, genre, invoice, track } from './fixtures';
import type { ResolvedEntity } from '../mapping/types';
import type { PaginationOptions } from '../plan/select';

const DIALECTS: DialectName[] = ['postgres', 'mysql', 'sqlite', 'mssql'];

interface Case {
	name: string;
	entity: ResolvedEntity;
	filter?: unknown;
	pagination?: PaginationOptions;
}

/**
 * One corpus, compiled four ways. A divergence between dialects shows up as four snapshot diffs
 * sitting next to each other in review, which is the whole point of the exercise.
 */
const CASES: Case[] = [
	{ name: 'no filter', entity: album },
	{ name: 'equality', entity: album, filter: { title: 'Jagged Little Pill' } },
	{ name: 'explicit null value', entity: album, filter: { title: null } },
	{ name: 'null operator', entity: album, filter: { title_null: true } },
	{ name: 'null operator, false', entity: album, filter: { title_null: false } },
	{ name: 'notnull operator', entity: album, filter: { title_notnull: true } },
	{ name: 'ne', entity: album, filter: { title_ne: 'x' } },
	{ name: 'ne null', entity: album, filter: { title_ne: null } },
	{ name: 'in', entity: album, filter: { albumId_in: [1, 2, 3] } },
	{ name: 'in, empty', entity: album, filter: { albumId_in: [] } },
	{ name: 'nin, empty', entity: album, filter: { albumId_nin: [] } },
	{
		name: 'in, from a non-array iterable',
		entity: album,
		// A getter, because Map.keys() is a one-shot iterator: sharing one instance across the four
		// dialect runs would let the first run consume it and leave the rest with an empty list.
		get filter() {
			return {
				albumId_in: new Map([
					[1, 'a'],
					[2, 'b'],
				]).keys(),
			};
		},
	},
	{
		name: 'two operators on one field',
		entity: track,
		filter: { milliseconds_gte: 1000, milliseconds_lt: 5000 },
	},
	{ name: 'like', entity: track, filter: { name_like: '%rock%' } },
	{ name: 'ilike', entity: track, filter: { name_ilike: '%rock%' } },
	{ name: 'and', entity: track, filter: { _and: [{ name: 'a' }, { composer: 'b' }] } },
	{ name: 'or', entity: track, filter: { _or: [{ name: 'a' }, { composer: 'b' }] } },
	{ name: 'empty and', entity: track, filter: { _and: [] } },
	{ name: 'empty or', entity: track, filter: { _or: [] } },
	{ name: 'not, scalar', entity: track, filter: { _not: { name: 'a' } } },
	{
		name: 'nested and inside or',
		entity: track,
		filter: { _or: [{ _and: [{ name: 'a' }, { composer: 'b' }] }, { name: 'c' }] },
	},

	// Relationships.
	{ name: 'many to one, nested filter', entity: album, filter: { artist: { name: 'Alanis' } } },
	{
		name: 'many to one, collapsed to the foreign key',
		entity: album,
		filter: { artist: { artistId: 5 } },
	},
	{
		name: 'many to one, collapsed to a foreign key IN',
		entity: album,
		filter: { artist: { artistId_in: [5, 6] } },
	},
	{ name: 'many to one, null means no related row', entity: album, filter: { artist: null } },
	{ name: 'many to one, empty object means has one', entity: album, filter: { artist: {} } },
	{ name: 'one to many', entity: album, filter: { tracks: { name: 'x' } } },
	{
		name: 'one to many, empty object means has at least one',
		entity: album,
		filter: { tracks: {} },
	},
	{ name: 'many to many via pivot', entity: track, filter: { genres: { name: 'Rock' } } },
	{ name: 'many to many, inverse side', entity: genre, filter: { tracks: { name: 'x' } } },

	// The case that decided EXISTS over JOIN.
	{
		name: 'not over a to-many relationship',
		entity: album,
		filter: { _not: { tracks: { name: 'x' } } },
	},
	{
		name: 'not over a many to many',
		entity: track,
		filter: { _not: { genres: { name: 'Rock' } } },
	},

	// Depth and mixture.
	{ name: 'two levels deep', entity: track, filter: { album: { artist: { name: 'Alanis' } } } },
	{
		name: 'relationship combined with scalars and or',
		entity: track,
		filter: {
			_or: [{ album: { artist: { name: 'Alanis' } } }, { name_ilike: '%rock%' }],
			milliseconds_gte: 1000,
		},
	},

	// Paging and ordering.
	{
		name: 'pagination and ordering',
		entity: album,
		filter: { title_ne: null },
		pagination: { orderBy: { title: 'DESC' }, limit: 10, offset: 20 },
	},
	{ name: 'limit only', entity: album, pagination: { limit: 5 } },
	{ name: 'offset only', entity: album, pagination: { offset: 5 } },
	{
		name: 'ordering by the primary key is not duplicated',
		entity: album,
		pagination: { orderBy: { albumId: 'ASC' }, limit: 5 },
	},

	// Schema qualification.
	{ name: 'non default schema', entity: invoice, filter: { total_gte: 10 } },
];

describe.each(DIALECTS)('%s', (dialectName) => {
	const dialect = allDialects[dialectName];

	it.each(CASES.map((testCase) => [testCase.name, testCase] as const))('%s', (_name, testCase) => {
		const { text, params } = compile(
			planFind(testCase.entity, testCase.filter, testCase.pagination),
			dialect
		);

		expect({ sql: text, params: params.map((param) => param.value) }).toMatchSnapshot();
	});
});
