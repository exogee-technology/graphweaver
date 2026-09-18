import {
	baseMarshaller,
	type ColumnMeta,
	type ColumnType,
	type Marshaller,
} from '@exogee/graphweaver-sql';
import { TYPES } from 'tedious';

/**
 * SQL Server is the only dialect that needs a type for every bound parameter, and the defaults are
 * lossy in ways that do not announce themselves: tedious turns `decimal` into a JS number unless
 * told otherwise, and hands `uniqueidentifier` back uppercase.
 */
export const mssqlMarshaller: Marshaller = {
	...baseMarshaller,

	toDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'bigint':
				// tedious binds BigInt as a string.
				return String(value);
			case 'decimal':
				// A string, like the other three dialects send, rather than `Number`. A double
				// cannot hold what a numeric column can, and `fromDatabase` already hands decimals
				// back as strings, so converting here made the round trip lossy in one direction
				// only.
				return String(value);
			case 'json':
				return JSON.stringify(value);
			case 'uuid':
				return typeof value === 'string' ? value.toLowerCase() : value;
			case 'unknown':
				// Left alone: driverParameterType works the type out from the value, so coercing
				// here would fight it.
				return value;
			case 'string':
			case 'text':
				// A GraphQL `ID` field maps to a string column type, but the column underneath is
				// very often an int. The other three drivers coerce silently; tedious validates the
				// parameter against its declared TDS type and rejects a number bound as NVarChar,
				// so coerce here. SQL Server converts back on comparison.
				return typeof value === 'string' ? value : String(value);
			default:
				return baseMarshaller.toDatabase(value, type);
		}
	},

	fromDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'uuid':
				// The one dialect that returns these uppercase.
				return typeof value === 'string' ? value.toLowerCase() : value;
			case 'decimal':
				return String(value);
			case 'time':
				// tedious hands back a Date on 1970-01-01, so take the clock part.
				return value instanceof Date ? value.toISOString().slice(11, 23) : value;
			case 'binary':
				return value;
			default:
				return baseMarshaller.fromDatabase(value, type);
		}
	},

	driverParameterType(type: ColumnType, meta?: ColumnMeta, value?: unknown) {
		// `unknown` comes from raw queries, where nothing declared a type. Read the value.
		if (type === 'unknown') {
			if (typeof value === 'boolean') return TYPES.Bit;
			if (typeof value === 'bigint') return TYPES.BigInt;
			if (typeof value === 'number') {
				return Number.isInteger(value) ? TYPES.Int : TYPES.Float;
			}
			if (value instanceof Date) return TYPES.DateTime2;
			if (Buffer.isBuffer(value)) return TYPES.VarBinary;
			return TYPES.NVarChar;
		}

		switch (type) {
			case 'boolean':
				return TYPES.Bit;
			case 'int':
				return TYPES.Int;
			case 'bigint':
				return TYPES.BigInt;
			case 'float':
				return TYPES.Float;
			case 'decimal':
				// NVarChar, not TYPES.Decimal, and the difference is silent data loss.
				//
				// tedious defaults a Decimal to scale 0, so a parameter declared that way rounds:
				// 1234.5678 written to a DECIMAL(10,4) column comes back as 1235. The scale is
				// knowable only from `columnMeta`, which codegen never emits, and tedious takes a
				// Decimal's value as a JS number regardless, so anything past ~15 significant
				// digits would be gone before it reached the wire.
				//
				// SQL Server converts the text to the column's own decimal type exactly, and
				// decimal outranks nvarchar in data type precedence, so a comparison converts the
				// parameter rather than the column. This is also the path every generated entity
				// already takes -- codegen maps a decimal column to GraphQL String and emits no
				// `columnType` -- so declaring the type now agrees with generating it, instead of
				// being quietly worse than saying nothing.
				return TYPES.NVarChar;
			case 'uuid':
				return TYPES.UniqueIdentifier;
			case 'date':
				return TYPES.Date;
			case 'time':
				return TYPES.Time;
			case 'datetime':
				return TYPES.DateTime2;
			case 'binary':
				return TYPES.VarBinary;
			case 'text':
			case 'json':
				return TYPES.NVarChar;
			default:
				return TYPES.NVarChar;
		}
	},
};
