import { describe, it, expect } from 'vitest';

import { inMemoryFilterFor } from './utils';
import { EntityMetadata, GRAPHQL_MAX_INT } from '@exogee/graphweaver';

class FakeUser {
	name: string;
	age: number;
	bankBalance: bigint;
	tags: string[];
	wow_i_am_a_field_with_an_annoying_name: number;
}

const fakeUserEntity: EntityMetadata = {
	type: 'entity',
	name: 'User',
	plural: 'Users',
	target: FakeUser,
	fields: {
		name: {
			name: 'name',
			target: FakeUser,
			getType: () => String,
		},
		age: {
			name: 'age',
			target: FakeUser,
			getType: () => Number,
		},
		bankBalance: {
			name: 'bankBalance',
			target: FakeUser,
			getType: () => BigInt,
		},
		tags: {
			name: 'tags',
			target: FakeUser,
			getType: () => [String],
		},
		wow_i_am_a_field_with_an_annoying_name: {
			name: 'wow_i_am_a_field_with_an_annoying_name',
			target: FakeUser,
			getType: () => Number,
		},
	},
};

describe('inMemoryFilterFor', () => {
	it('should filter a simple string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name: 'test' });
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'TEST' })).toBe(false);
		expect(filter({ name: 'TEST2' })).toBe(false);
		expect(filter({ name: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should filter a simple number', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { age: 5 });
		expect(filter({ age: 5 })).toBe(true);
		expect(filter({ age: 5.5 })).toBe(false);
		expect(filter({ age: '5' })).toBe(false);
		expect(filter({ age: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should filter a simple bigint', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { bankBalance: 5n });
		expect(filter({ bankBalance: 5n })).toBe(true);
		expect(filter({ bankBalance: 5 })).toBe(false);
		expect(filter({ bankBalance: 5.5 })).toBe(false);
		expect(filter({ bankBalance: '5' })).toBe(false);
		expect(filter({ bankBalance: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply gt with a number', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { age_gt: 5 });
		expect(filter({ age: 5.1 })).toBe(true);
		expect(filter({ age: 5 })).toBe(false);
		expect(filter({ age: GRAPHQL_MAX_INT })).toBe(true);
		expect(filter({ age: Number.MIN_SAFE_INTEGER })).toBe(false);
		expect(filter({ age: Number.MAX_SAFE_INTEGER })).toBe(true);
		expect(filter({ age: '5' })).toBe(false);
		expect(filter({ age: '5.5' })).toBe(false);
		expect(filter({ age: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply gte with a number', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { age_gte: 5 });
		expect(filter({ age: 5.1 })).toBe(true);
		expect(filter({ age: 5 })).toBe(true);
		expect(filter({ age: 4.9 })).toBe(false);
		expect(filter({ age: GRAPHQL_MAX_INT })).toBe(true);
		expect(filter({ age: Number.MIN_SAFE_INTEGER })).toBe(false);
		expect(filter({ age: Number.MAX_SAFE_INTEGER })).toBe(true);
		expect(filter({ age: '5' })).toBe(false);
		expect(filter({ age: '5.5' })).toBe(false);
		expect(filter({ age: '4.9' })).toBe(false);
		expect(filter({ age: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply lt with a number', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { age_lt: 5 });
		expect(filter({ age: 4.9 })).toBe(true);
		expect(filter({ age: 5 })).toBe(false);
		expect(filter({ age: 5.1 })).toBe(false);
		expect(filter({ age: GRAPHQL_MAX_INT })).toBe(false);
		expect(filter({ age: Number.MIN_SAFE_INTEGER })).toBe(true);
		expect(filter({ age: Number.MAX_SAFE_INTEGER })).toBe(false);
		expect(filter({ age: '5' })).toBe(false);
		expect(filter({ age: '5.5' })).toBe(false);
		expect(filter({ age: '4.9' })).toBe(false);
		expect(filter({ age: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply lte with a number', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { age_lte: 5 });
		expect(filter({ age: 4.9 })).toBe(true);
		expect(filter({ age: 5 })).toBe(true);
		expect(filter({ age: 5.1 })).toBe(false);
		expect(filter({ age: GRAPHQL_MAX_INT })).toBe(false);
		expect(filter({ age: Number.MIN_SAFE_INTEGER })).toBe(true);
		expect(filter({ age: Number.MAX_SAFE_INTEGER })).toBe(false);
		expect(filter({ age: '5' })).toBe(false);
		expect(filter({ age: '5.5' })).toBe(false);
		expect(filter({ age: '4.9' })).toBe(false);
		expect(filter({})).toBe(false);
	});
	it('should apply gt with a bigint', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { bankBalance_gt: 5n });
		expect(filter({ bankBalance: 6n })).toBe(true);
		expect(filter({ bankBalance: 5n })).toBe(false);
		expect(filter({ bankBalance: BigInt(GRAPHQL_MAX_INT) })).toBe(true);
		expect(filter({ bankBalance: BigInt(Number.MAX_SAFE_INTEGER) * 1000n })).toBe(true);
		expect(filter({ bankBalance: BigInt(Number.MIN_SAFE_INTEGER) * 1000n })).toBe(false);
		expect(filter({ bankBalance: '5' })).toBe(false);
		expect(filter({ bankBalance: '5.5' })).toBe(false);
		expect(filter({ bankBalance: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply gte with a bigint', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { bankBalance_gte: 5n });
		expect(filter({ bankBalance: 6n })).toBe(true);
		expect(filter({ bankBalance: 5n })).toBe(true);
		expect(filter({ bankBalance: 4n })).toBe(false);
		expect(filter({ bankBalance: BigInt(GRAPHQL_MAX_INT) })).toBe(true);
		expect(filter({ bankBalance: BigInt(Number.MAX_SAFE_INTEGER) * 1000n })).toBe(true);
		expect(filter({ bankBalance: BigInt(Number.MIN_SAFE_INTEGER) * 1000n })).toBe(false);
		expect(filter({ bankBalance: '4' })).toBe(false);
		expect(filter({ bankBalance: '5' })).toBe(false);
		expect(filter({ bankBalance: '5.5' })).toBe(false);
		expect(filter({ bankBalance: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply lt with a bigint', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { bankBalance_lt: 5n });
		expect(filter({ bankBalance: 6n })).toBe(false);
		expect(filter({ bankBalance: 5n })).toBe(false);
		expect(filter({ bankBalance: 4n })).toBe(true);
		expect(filter({ bankBalance: BigInt(GRAPHQL_MAX_INT) })).toBe(false);
		expect(filter({ bankBalance: BigInt(Number.MAX_SAFE_INTEGER) * 1000n })).toBe(false);
		expect(filter({ bankBalance: BigInt(Number.MIN_SAFE_INTEGER) * 1000n })).toBe(true);
		expect(filter({ bankBalance: '5' })).toBe(false);
		expect(filter({ bankBalance: '5.5' })).toBe(false);
		expect(filter({ bankBalance: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply lte with a bigint', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { bankBalance_lte: 5n });
		expect(filter({ bankBalance: 6n })).toBe(false);
		expect(filter({ bankBalance: 5n })).toBe(true);
		expect(filter({ bankBalance: 4n })).toBe(true);
		expect(filter({ bankBalance: BigInt(GRAPHQL_MAX_INT) })).toBe(false);
		expect(filter({ bankBalance: BigInt(Number.MAX_SAFE_INTEGER) * 1000n })).toBe(false);
		expect(filter({ bankBalance: BigInt(Number.MIN_SAFE_INTEGER) * 1000n })).toBe(true);
		expect(filter({ bankBalance: '5' })).toBe(false);
		expect(filter({ bankBalance: '5.5' })).toBe(false);
		expect(filter({ bankBalance: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply like with a simple string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_like: 'test' });
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'TEST' })).toBe(false);
		expect(filter({ name: 'TEST2' })).toBe(false);
		expect(filter({ name: 'test test' })).toBe(false);
		expect(filter({ name: 'testtest' })).toBe(false);
		expect(filter({ name: 'test test test' })).toBe(false);
		expect(filter({})).toBe(false);

		const filter2 = inMemoryFilterFor(fakeUserEntity, { name_like: 'test%ing' });
		expect(filter2({ name: 'testing' })).toBe(true);
		expect(filter2({ name: 'TESTING' })).toBe(false);
		expect(filter2({ name: 'testings' })).toBe(false);
		expect(filter2({ name: 'testing test' })).toBe(false);
		expect(filter2({ name: 'test test' })).toBe(false);
		expect(filter2({ name: 'test and a bunch of stuffing' })).toBe(true);

		const filter3 = inMemoryFilterFor(fakeUserEntity, { name_like: 'test_ng' });
		expect(filter3({ name: 'testing' })).toBe(true);
		expect(filter3({ name: 'testings' })).toBe(false);
		expect(filter3({ name: 'testang' })).toBe(true);
		expect(filter3({ name: 'TESTANG' })).toBe(false);
	});

	it('should apply ilike with a simple string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_ilike: 'test' });
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'TEST' })).toBe(true);
		expect(filter({ name: 'TEST2' })).toBe(false);
		expect(filter({ name: 'test test' })).toBe(false);
		expect(filter({ name: 'testtest' })).toBe(false);
		expect(filter({ name: 'test test test' })).toBe(false);
		expect(filter({})).toBe(false);

		const filter2 = inMemoryFilterFor(fakeUserEntity, { name_ilike: 'test%ing' });
		expect(filter2({ name: 'testing' })).toBe(true);
		expect(filter2({ name: 'TESTING' })).toBe(true);
		expect(filter2({ name: 'testings' })).toBe(false);
		expect(filter2({ name: 'testing test' })).toBe(false);
		expect(filter2({ name: 'test test' })).toBe(false);
		expect(filter2({ name: 'test and a bunch of stuffing' })).toBe(true);

		const filter3 = inMemoryFilterFor(fakeUserEntity, { name_ilike: 'test_ng' });
		expect(filter3({ name: 'testing' })).toBe(true);
		expect(filter3({ name: 'testings' })).toBe(false);
		expect(filter3({ name: 'testang' })).toBe(true);
		expect(filter3({ name: 'TESTANG' })).toBe(true);
	});

	it('should apply like with a complex / regex character clashing string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_like: '%test.ing%' });
		expect(filter({ name: 'test.ing' })).toBe(true);
		expect(filter({ name: 'TEST.ING' })).toBe(false);
		expect(filter({ name: 'test.ing2' })).toBe(true);
		expect(filter({ name: 'TEST.ING2' })).toBe(false);
		expect(filter({ name: 'test ing' })).toBe(false);
		expect(filter({ name: 'test ing2' })).toBe(false);
		expect(filter({ name: 'test ing test' })).toBe(false);
		expect(filter({ name: 'test.ing test' })).toBe(true);
	});

	it('should apply ilike with a complex / regex character clashing string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_ilike: '%test.ing%' });
		expect(filter({ name: 'test.ing' })).toBe(true);
		expect(filter({ name: 'TEST.ING' })).toBe(true);
		expect(filter({ name: 'test.ing2' })).toBe(true);
		expect(filter({ name: 'TEST.ING2' })).toBe(true);
		expect(filter({ name: 'test ing' })).toBe(false);
		expect(filter({ name: 'test ing2' })).toBe(false);
		expect(filter({ name: 'test ing test' })).toBe(false);
		expect(filter({ name: 'test.ing test' })).toBe(true);
	});

	it('should apply in with a string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_in: ['test', 'test2'] });
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(true);
		expect(filter({ name: 'TEST' })).toBe(false);
		expect(filter({ name: 'TEST2' })).toBe(false);
		expect(filter({ name: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply nin with a string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_nin: ['test', 'test2'] });
		expect(filter({ name: 'test' })).toBe(false);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'TEST' })).toBe(true);
		expect(filter({ name: 'TEST2' })).toBe(true);
		expect(filter({ name: null })).toBe(true);
		expect(filter({})).toBe(true);
	});

	it('should apply ne with a string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_ne: 'test' });
		expect(filter({ name: 'test' })).toBe(false);
		expect(filter({ name: 'test2' })).toBe(true);
		expect(filter({ name: 'TEST' })).toBe(true);
		expect(filter({ name: 'TEST2' })).toBe(true);
		expect(filter({ name: null })).toBe(true);
		expect(filter({})).toBe(true);
	});

	it('should apply notnull with a string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_notnull: true });
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(true);
		expect(filter({ name: 'TEST' })).toBe(true);
		expect(filter({ name: 'TEST2' })).toBe(true);
		expect(filter({ name: null })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply null with a string', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, { name_null: true });
		expect(filter({ name: 'test' })).toBe(false);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'TEST' })).toBe(false);
		expect(filter({ name: 'TEST2' })).toBe(false);
		expect(filter({ name: null })).toBe(true);
		expect(filter({})).toBe(true);
	});

	it('should correctly determine the field name of a field with _ in its name', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, {
			wow_i_am_a_field_with_an_annoying_name_gt: 5,
		});
		expect(filter({ wow_i_am_a_field_with_an_annoying_name: 6 })).toBe(true);
		expect(filter({ wow_i_am_a_field_with_an_annoying_name: 5 })).toBe(false);
		expect(filter({ wow_i_am_a_field_with_an_annoying_name: 4 })).toBe(false);
		expect(filter({ wow_i_am_a_field_with_an_annoying_name: 6, otherKey: 'whatever' })).toBe(true);

		const filter2 = inMemoryFilterFor(fakeUserEntity, {
			wow_i_am_a_field_with_an_annoying_name: 5,
		});
		expect(filter2({ wow_i_am_a_field_with_an_annoying_name: 6 })).toBe(false);
		expect(filter2({ wow_i_am_a_field_with_an_annoying_name: 5 })).toBe(true);
		expect(filter2({ wow_i_am_a_field_with_an_annoying_name: 4 })).toBe(false);
	});

	it('should apply _or', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, {
			_or: [{ name: 'test' }, { age: 5 }, { age_lt: 4 }],
		});
		expect(filter({ name: 'test' })).toBe(true);
		expect(filter({ age: 5 })).toBe(true);
		expect(filter({ name: 'test2', age: 5 })).toBe(true);
		expect(filter({ name: 'test', age: 5 })).toBe(true);
		expect(filter({ name: 'test2' })).toBe(false);
		expect(filter({ name: 'test2', age: 3 })).toBe(true);
		expect(filter({ age: 6 })).toBe(false);
		expect(filter({})).toBe(false);
	});

	it('should apply _and', () => {
		const filter = inMemoryFilterFor(fakeUserEntity, {
			_and: [{ name: 'test' }, { age: 5 }, { bankBalance_lt: 6n }],
		});
		expect(filter({ name: 'test', age: 5, bankBalance: 5n })).toBe(true);
		expect(filter({ name: 'test', age: 5, bankBalance: 6n })).toBe(false);
		expect(filter({ name: 'test', age: 5 })).toBe(false);
		expect(filter({ name: 'test', bankBalance: 5n })).toBe(false);
		expect(filter({ age: 5, bankBalance: 5n })).toBe(false);
		expect(filter({ name: 'test' })).toBe(false);
		expect(filter({ age: 5 })).toBe(false);
		expect(filter({ bankBalance: 5n })).toBe(false);
		expect(filter({})).toBe(false);
	});
});
