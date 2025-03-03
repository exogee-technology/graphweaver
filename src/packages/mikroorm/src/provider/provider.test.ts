import { describe, it, expect } from 'vitest';
import { gqlToMikro } from './provider';

describe('gqlToMikro', () => {
	it('transforms filter: nested -> with numbers', () => {
		const test = {
			field1_gt: 1,
			field1_lt: 2,
			field1_in: [1, 2, 3],
			nested: {
				field1: 1,

				field2_gte: 3,
				field2_lte: 4,
				field2_in: [1, 2, 3],
			},
		};
		const expectedResult = {
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
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('transforms filter: numbers -> and null', () => {
		const test = {
			field1_gt: 1,
			field1_lt: 2,
			field1_in: [1, 2, 3],
			field1_null: false,
			field1_notnull: true,
		};
		const expectedResult = {
			field1: {
				$gt: 1,
				$lt: 2,
				$in: [1, 2, 3],
				$ne: null,
			},
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('transforms filter: numbers -> in and eq', () => {
		const test = {
			field1_in: [1, 2, 3],
			field1: 4,
		};
		const expectedResult = {
			field1: { $in: [1, 2, 3], $eq: 4 },
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('transforms filter: strings -> nested', () => {
		const test = {
			nested: {
				field1: { id: 'uno' },
				field2_gte: 'someValue',
				field2_lte: 'someValue',
				field2_nin: ['someValue'],
			},
		};
		const expectedResult = {
			nested: {
				field1: { id: 'uno' },
				field2: {
					$gte: 'someValue',
					$lte: 'someValue',
					$nin: ['someValue'],
				},
			},
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('should throw error -> ambiguous property', () => {
		const test = {
			_and: [{ field1_in: [1, 2, 3], field1: 4, field1_null: true }, { field1_nin: [1, 2, 3] }],
		};
		expect(() => gqlToMikro(test)).toThrow();
	});

	it('should throw error -> ambiguous property - null then string', () => {
		const test = { field1_null: true, field1: 'dos' };
		expect(() => gqlToMikro(test)).toThrow();
	});

	it("should throw error -> ambiguous property - we don't support collapsing same values", () => {
		const test = { field1_null: true, field1: null };
		expect(() => gqlToMikro(test)).toThrow();
	});

	it('transforms filter: strings -> in and eq', () => {
		const test = { field1_nin: ['one'], field1: 'two' };
		const expectedResult = { field1: { $nin: ['one'], $eq: 'two' } };
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('transforms filter: strings -> or and null', () => {
		const test = {
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
		};
		const expectedResult = {
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
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});

	it('transforms filter: complicated filter with nested properties, arrays, nulls, strings, and numbers', () => {
		const test = {
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
		};
		const expectedResult = {
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
		};
		expect(gqlToMikro(test)).toEqual(expectedResult);
	});
});
