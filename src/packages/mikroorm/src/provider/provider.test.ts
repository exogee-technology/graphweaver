import { describe, it, expect } from 'vitest';

import { gqlToMikro } from './provider';

const filters = [
	{
		key: 'nested -> with numbers',
		throws: false,
		test: {
			field1_gt: 1,
			field1_lt: 2,
			field1_in: [1, 2, 3],
			nested: {
				field1: 1,
				field2_gte: 3,
				field2_lte: 4,
				field2_in: [1, 2, 3],
			},
		},
		expectedResult: {
			field1: {
				$gt: 1,
				$lt: 2,
				$in: [1, 2, 3],
			},
			nested: {
				field1: 1,
				field2: {
					$gte: 3,
					$lte: 4,
					$in: [1, 2, 3],
				},
			},
		},
	},
	{
		key: 'numbers -> and null',
		throws: false,
		test: {
			field1_gt: 1,
			field1_lt: 2,
			field1_in: [1, 2, 3],
			field1_null: false,
			field1_notnull: true,
		},
		expectedResult: {
			field1: {
				$gt: 1,
				$lt: 2,
				$in: [1, 2, 3],
				$ne: null,
			},
		},
	},
	{
		key: 'numbers -> in and eq',
		throws: false,
		test: {
			field1_in: [1, 2, 3],
			field1: 4,
		},
		expectedResult: {
			field1: { $in: [1, 2, 3], $eq: 4 },
		},
	},
	{
		key: 'strings -> nested',
		throws: false,
		test: {
			nested: {
				field1: { id: 'uno' },
				field2_gte: 'someValue',
				field2_lte: 'someValue',
				field2_nin: ['someValue'],
			},
		},
		expectedResult: {
			nested: {
				field1: { id: 'uno' },
				field2: {
					$gte: 'someValue',
					$lte: 'someValue',
					$nin: ['someValue'],
				},
			},
		},
	},
	{
		key: 'should throw error -> ambiguous property',
		throws: true,
		test: {
			_and: [{ field1_in: [1, 2, 3], field1: 4, field1_null: true }, { field1_nin: [1, 2, 3] }],
		},
		expectedResult: 'Should error here because is ambiguous, is it 4 or null?',
	},
	{
		key: 'should throw error -> ambiguous property - null then string',
		throws: true,
		test: { field1_null: true, field1: 'dos' },
		expectedResult: 'Should error here because is ambiguous, is it dos or null?',
	},
	{
		key: "should throw error -> ambiguous property - we don't support collapsing same values",
		throws: true,
		test: { field1_null: true, field1: null },
		expectedResult: 'Should error here because is ambiguous, is it null or null?',
	},
	{
		key: 'strings -> in and eq',
		throws: false,
		test: { field1_nin: ['one'], field1: 'two' },
		expectedResult: { field1: { $nin: ['one'], $eq: 'two' } },
	},
	{
		key: 'strings -> or and null',
		throws: false,
		test: {
			_or: [
				{
					user: {
						id_null: true,
					},
				},
				{
					user: {
						id: 'seis',
					},
				},
			],
		},
		expectedResult: {
			$or: [
				{
					user: {
						id: { $eq: null },
					},
				},
				{
					user: {
						id: 'seis',
					},
				},
			],
		},
	},
	{
		key: 'complicated filter with nested properties, arrays, nulls, strings, and numbers',
		throws: false,
		test: {
			field1_gt: 5,
			field2_lt: 10,
			field3_in: ['a', 'b', 'c'],
			field4_null: true,
			field5_notnull: true,
			nested1: {
				subfield1: 1,
				subfield2_gte: 2,
				subfield3_lte: 3,
				subfield4_in: [4, 5, 6],
				subnested: {
					subsubfield1: 'value1',
					subsubfield2_nin: ['value2', 'value3'],
					subsubfield3_null: false,
				},
			},
			nested2: {
				subfield1: 'string1',
				subfield2: {
					subsubfield1: 'string2',
					subsubfield2_gt: 7,
				},
			},
		},
		expectedResult: {
			field1: { $gt: 5 },
			field2: { $lt: 10 },
			field3: { $in: ['a', 'b', 'c'] },
			field4: { $eq: null },
			field5: { $ne: null },
			nested1: {
				subfield1: 1,
				subfield2: { $gte: 2 },
				subfield3: { $lte: 3 },
				subfield4: { $in: [4, 5, 6] },
				subnested: {
					subsubfield1: 'value1',
					subsubfield2: { $nin: ['value2', 'value3'] },
					subsubfield3: { $ne: null },
				},
			},
			nested2: {
				subfield1: 'string1',
				subfield2: {
					subsubfield1: 'string2',
					subsubfield2: { $gt: 7 },
				},
			},
		},
	},
];

describe('gqlToMikro', () => {
	filters.forEach(({ key, test, expectedResult, throws }) => {
		it(key, () => {
			if (throws) {
				expect(() => gqlToMikro(test)).toThrow();
			} else {
				expect(gqlToMikro(test)).toEqual(expectedResult);
			}
		});
	});
});
