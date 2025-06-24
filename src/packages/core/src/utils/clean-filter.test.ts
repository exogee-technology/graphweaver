import { describe, it, expect } from 'vitest';
import { cleanFilter } from './clean-filter';

describe('cleanFilter', () => {
	it('should remove undefined values', () => {
		expect(
			cleanFilter<{ name: string }>({
				name: undefined,
			})
		).toEqual(undefined);
	});

	it('should remove null values', () => {
		expect(
			cleanFilter<{ name: string }>({
				name: null,
			} as any)
		).toEqual(undefined);
	});

	it('should hoist _and and _or values with one item in them', () => {
		expect(
			cleanFilter<{ name: string }>({
				_and: [
					{
						name: 'test',
					},
				],
			})
		).toEqual({ name: 'test' });

		expect(
			cleanFilter<{ name: string }>({
				_or: [
					{
						name: 'test',
					},
				],
			})
		).toEqual({ name: 'test' });
	});

	it('should remove empties and hoist at the same time', () => {
		expect(
			cleanFilter<{ name: string }>({
				_and: [
					{
						name: 'test',
					},
					{
						_and: [null] as any,
					},
				],
			})
		).toEqual({ name: 'test' });
		expect(
			cleanFilter<{ name: string }>({
				_or: [
					{
						name: 'test',
					},
					{
						_or: [null] as any,
					},
				],
			})
		).toEqual({ name: 'test' });
	});

	it('should handle a specific case seen in production', () => {
		expect(
			cleanFilter<{ users: { _in: string[] } }>({
				_and: [
					{
						users: {
							_in: ['1', '2'],
						},
					},
					{
						_and: [null] as any,
					},
				],
			})
		).toEqual({
			users: {
				_in: ['1', '2'],
			},
		});
	});

	it('should recurse into arrays and do the same stuff', () => {
		expect(
			cleanFilter<{ users: { _in: string[] } }>({
				_and: [
					{
						users: {
							_in: [null] as any,
						},
					},
					{
						_and: [null] as any,
					},
				],
			})
		).toEqual(undefined);
	});

	it('should leave complex valid queries alone', () => {
		const filter = {
			_and: [
				{
					users: {
						_in: ['1', '2'],
					},
				},
				{
					_and: [
						{ users: { name: 'test', email: 'test@test.com' } },
						{ users: { name: 'test2', email: 'test2@test.com' } },
					] as any,
				},
			],
		};

		expect(cleanFilter<{ users: { _in: string[] } }>(filter)).toEqual(filter);
	});
});
