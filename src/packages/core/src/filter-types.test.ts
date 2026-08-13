import { describe, expect, it } from 'vitest';

import { Filter } from './types';

type TestEntity = {
	name: string;
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
});
