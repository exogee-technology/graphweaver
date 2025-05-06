import { describe, it, expect } from 'vitest';
import { EntityMetadata, graphweaverMetadata } from '.';

class TestEntity {}

const stubEntityMetadata: EntityMetadata<any> = {
	type: 'entity',
	name: 'Test',
	primaryKeyField: 'testId',
	plural: 'Tests',
	target: TestEntity,
	fields: {
		testId: {
			name: 'testId',
			target: TestEntity,
			getType: () => String,
		},
		name: {
			name: 'name',
			target: TestEntity,
			getType: () => String,
		},
		created_at: {
			name: 'created_at',
			target: TestEntity,
			getType: () => String,
		},
		field_with_lots_of_underscores: {
			name: 'field_with_lots_of_underscores',
			target: TestEntity,
			getType: () => String,
		},
		field_with_list_return_type: {
			name: 'field_with_list_return_type',
			target: TestEntity,
			getType: () => [String],
		},
	},
};

describe('Metadata', () => {
	it('should correctly identify the field for a filter key that exactly matches the field name', () => {
		expect(graphweaverMetadata.fieldMetadataForFilterKey(stubEntityMetadata, 'testId')?.name).toBe(
			'testId'
		);
	});

	it('should correctly identify the field for a filter key with an in operator', () => {
		expect(
			graphweaverMetadata.fieldMetadataForFilterKey(stubEntityMetadata, 'testId_in')?.name
		).toBe('testId');
	});

	it('should correctly identify the field for a filter key where the field has multiple underscores in the name', () => {
		expect(
			graphweaverMetadata.fieldMetadataForFilterKey(
				stubEntityMetadata,
				'field_with_lots_of_underscores_gt'
			)?.name
		).toBe('field_with_lots_of_underscores');
	});

	it('should correctly identify the field for a filter key where the field has a list return type', () => {
		expect(
			graphweaverMetadata.fieldMetadataForFilterKey(
				stubEntityMetadata,
				'field_with_list_return_type_in'
			)?.getType()
		).toStrictEqual([String]);
	});

	it('should ignore a filter key that does not specify a valid filter operator as the last portion of the key', () => {
		expect(
			graphweaverMetadata.fieldMetadataForFilterKey(
				stubEntityMetadata,
				'field_with_lots_of_underscores_stuff'
			)
		).toBe(undefined);
	});
});
