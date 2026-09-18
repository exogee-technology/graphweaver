import { describe, expect, it } from 'vitest';

import { Filter } from './types';

type Track = {
	trackId: string;
	name: string;
};

type TestEntity = {
	name: string;
	tags: string[];
	releasedAt: Date;
	tracks: Track[];
	headliner: Track;
};

describe('Filter', () => {
	it('accepts one filter object for _not', () => {
		const filter: Filter<TestEntity> = {
			_not: {
				name: 'Example',
			},
		};

		expect(filter).toEqual({
			_not: {
				name: 'Example',
			},
		});
	});

	describe('_exists', () => {
		it('is offered on relationships, in both directions', () => {
			const filter: Filter<TestEntity> = { tracks_exists: false, headliner_exists: true };

			expect(filter).toEqual({ tracks_exists: false, headliner_exists: true });
		});

		it('is not offered on data', () => {
			// A type level assertion: these keys must not exist, or the type would be promising an
			// operator the schema does not expose and no provider would answer. `Date` is an object
			// and a `string[]` is a list, so both are easy to sweep up by accident.
			const filter: Filter<TestEntity> = {};

			// @ts-expect-error a scalar has nothing to exist
			filter.name_exists = true;
			// @ts-expect-error a list of scalars is a column, not a relationship
			filter.tags_exists = true;
			// @ts-expect-error a date is an object but not a related entity
			filter.releasedAt_exists = true;
		});
	});
});
