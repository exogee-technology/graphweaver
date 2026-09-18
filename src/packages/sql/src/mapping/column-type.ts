import { getFieldTypeWithMetadata, graphweaverMetadata } from '@exogee/graphweaver';
import type { FieldMetadata } from '@exogee/graphweaver';
import type { ColumnType } from '../ir/nodes';

/**
 * Infers a column type from the field's GraphQL type.
 *
 * Deliberately conservative: anything it cannot place becomes `unknown`, which marshals as a
 * pass-through. Import codegen emits an explicit `type:` for the cases convention cannot reach --
 * decimal, time, binary, uuid -- rather than having this guess from a name.
 */
const BY_NAME: Record<string, ColumnType> = {
	ID: 'string',
	String: 'string',
	Boolean: 'boolean',
	Int: 'int',
	Float: 'float',
	Number: 'float',
	Date: 'datetime',
	DateTime: 'datetime',
	ISOStringScalar: 'datetime',
	ISODateStringScalar: 'datetime',
	DateScalar: 'date',
	TimeScalar: 'time',
	BigInt: 'bigint',
	GraphQLBigInt: 'bigint',
	JSON: 'json',
	JSONObject: 'json',
	GraphQLJSON: 'json',
	Byte: 'binary',
	GraphQLByte: 'binary',
	UUID: 'uuid',
};

const nameOfType = (type: unknown): string | undefined => {
	if (typeof type === 'function') return type.name;
	if (type && typeof type === 'object' && 'name' in type) return String((type as any).name);
	return undefined;
};

export const columnTypeForField = (field: FieldMetadata<any, any>): ColumnType => {
	const { fieldType, isList } = getFieldTypeWithMetadata(field.getType);

	// A list of scalars is an array column. How that list is actually stored is a mapping
	// decision, not something inferable from the GraphQL type, so it comes from the column meta.
	if (isList) return 'array';

	if (graphweaverMetadata.hasEnum(fieldType as any)) return 'string';

	const name = nameOfType(fieldType);
	if (!name) return 'unknown';

	return BY_NAME[name] ?? 'unknown';
};

/** The element type of a list field, for an array column's meta. */
export const itemTypeForField = (field: FieldMetadata<any, any>): ColumnType => {
	const { fieldType } = getFieldTypeWithMetadata(field.getType);

	if (graphweaverMetadata.hasEnum(fieldType as any)) return 'string';

	const name = nameOfType(fieldType);
	return name ? (BY_NAME[name] ?? 'unknown') : 'unknown';
};
