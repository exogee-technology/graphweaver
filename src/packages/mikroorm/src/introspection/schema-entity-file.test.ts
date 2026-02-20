import { describe, it, expect } from 'vitest';
import { type EntityMetadata, type EntityProperty, type NamingStrategy, type Platform, ReferenceKind } from '@mikro-orm/core';
import { SchemaEntityFile } from './files/schema-entity-file';

const mockPlatform = {
	getMappedType: () => ({
		getColumnType: () => 'mocked-type',
	}),
} as unknown as Platform;
const mockNamingStrategy = {
	propertyToColumnName: (name: string) => name,
	getClassName: (name: string) => name,
} as unknown as NamingStrategy;
const makeScalarProp = (overrides: Partial<EntityProperty>): EntityProperty =>
	({
		name: 'field',
		primary: false,
		kind: ReferenceKind.SCALAR,
		type: 'string',
		runtimeType: 'string',
		fieldNames: ['field'],
		columnTypes: ['varchar'],
		autoincrement: false,
		nullable: false,
		enum: false,
		ref: false,
		default: undefined,
		generated: undefined,
		...overrides,
	}) as EntityProperty;
const makeMeta = (className: string, pkProp: EntityProperty, extraProps: EntityProperty[] = []): EntityMetadata => {
	const allProps = [pkProp, ...extraProps];
	return {
		className,
		collection: `${className.toLowerCase()}s`,
		primaryKeys: [pkProp.name],
		pivotTable: false,
		properties: Object.fromEntries(allProps.map((p) => [p.name, p])),
		props: allProps,
		getPrimaryProps: () => [pkProp],
	} as unknown as EntityMetadata;
};
const nameProp = makeScalarProp({
	name: 'name',
	fieldNames: ['name'],
});

describe('SchemaEntityFile - primary key client generation detection', () => {
	it('should NOT emit clientGeneratedPrimaryKeys for an autoincrement PK', () => {
		// Auto Increment Column
		const pk = makeScalarProp({
			name: 'artistId',
			primary: true,
			type: 'number',
			runtimeType: 'number',
			fieldNames: ['artistId'],
			columnTypes: ['integer'],
			autoincrement: true,
		});

		const file = new SchemaEntityFile(
			makeMeta('Artist', pk, [nameProp]),
			mockNamingStrategy,
			mockPlatform,
			'postgresql',
			new Map<string, EntityMetadata>(),
			false
		);

		expect(file.generate()).not.toContain('clientGeneratedPrimaryKeys: true');
	});

	it('should NOT emit clientGeneratedPrimaryKeys for a UUID PK with a DB-side default', () => {
		// UUID column with DEFAULT gen_random_uuid()
		const pk = makeScalarProp({
			name: 'albumId',
			primary: true,
			type: 'string',
			runtimeType: 'string',
			fieldNames: ['albumId'],
			columnTypes: ['uuid'],
			autoincrement: false,
			default: undefined,
			defaultRaw: 'gen_random_uuid()',
		});

		const file = new SchemaEntityFile(
			makeMeta('Album', pk, [nameProp]),
			mockNamingStrategy,
			mockPlatform,
			'postgresql',
			new Map<string, EntityMetadata>(),
			false
		);

		expect(file.generate()).not.toContain('clientGeneratedPrimaryKeys: true');
	});

	it('should NOT emit clientGeneratedPrimaryKeys for a string PK with a generated value', () => {
		// String column with concat value
		const pk = makeScalarProp({
			name: 'albumId',
			primary: true,
			type: 'string',
			runtimeType: 'string',
			fieldNames: ['albumId'],
			columnTypes: ['uuid'],
			autoincrement: false,
			generated: 'concat("ALB-", uuid_generate_v4())',
		});

		const file = new SchemaEntityFile(
			makeMeta('Album', pk, [nameProp]),
			mockNamingStrategy,
			mockPlatform,
			'postgresql',
			new Map<string, EntityMetadata>(),
			false
		);

		expect(file.generate()).not.toContain('clientGeneratedPrimaryKeys: true');
	});

	it('should emit clientGeneratedPrimaryKeys: true for an integer PK with no auto-generation', () => {
		// Integer column, client generates the Primary Key value
		const pk = makeScalarProp({
			name: 'trackId',
			primary: true,
			type: 'number',
			runtimeType: 'number',
			fieldNames: ['trackId'],
			columnTypes: ['integer'],
			autoincrement: false,
		});

		const file = new SchemaEntityFile(
			makeMeta('Track', pk, [nameProp]),
			mockNamingStrategy,
			mockPlatform,
			'postgresql',
			new Map<string, EntityMetadata>(),
			false
		);

		expect(file.generate()).toContain('apiOptions: { clientGeneratedPrimaryKeys: true }');
	});

	it('should emit clientGeneratedPrimaryKeys: true for an integer PK and no other props', () => {
		// Integer column, client generates the Primary Key value
		const pk = makeScalarProp({
			name: 'trackId',
			primary: true,
			type: 'number',
			runtimeType: 'number',
			fieldNames: ['trackId'],
			columnTypes: ['integer'],
			autoincrement: false,
		});

		const file = new SchemaEntityFile(
			makeMeta('Track', pk),
			mockNamingStrategy,
			mockPlatform,
			'postgresql',
			new Map<string, EntityMetadata>(),
			false
		);

		expect(file.generate()).toContain('apiOptions: { clientGeneratedPrimaryKeys: true }');
	});
});
