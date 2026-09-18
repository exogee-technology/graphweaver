import type { ColumnMeta, ColumnType } from '../ir/nodes';

export type { ColumnMeta };

/**
 * Converts between JS values and whatever the driver wants to bind or hands back.
 *
 * Every driver is wrong in a different way by default -- mysql2 loses bigint precision, tedious
 * turns decimals into JS numbers, each one parses dates in its own timezone -- so the rule is that
 * we force each driver into string-returning UTC mode and do all of the conversion here. Driver
 * date parsing is where silent cross-dialect corruption lives.
 */
export interface Marshaller {
	/** A value from a filter or a write payload, on its way to the driver. */
	toDatabase(value: unknown, type: ColumnType, meta?: ColumnMeta): unknown;

	/** A raw value off a result row, on its way to the entity. */
	fromDatabase(value: unknown, type: ColumnType, meta?: ColumnMeta): unknown;

	/**
	 * SQL Server only: the `TYPES.*` to hand `request.addParameter`. Every parameter needs one,
	 * and getting `decimal` wrong is lossy and silent.
	 *
	 * The value is passed as well because a raw query's parameters are typed `unknown` -- the
	 * point of a raw query being that we did not build the statement and cannot know. In that
	 * case the only honest source of a type is the value itself.
	 */
	driverParameterType?(type: ColumnType, meta?: ColumnMeta, value?: unknown): unknown;
}

/** The encoding to assume when a column does not say. Matches what MikroORM wrote. */
const DEFAULT_ARRAY_ENCODING = 'delimited';
const DEFAULT_DELIMITER = ',';

export const encodeArray = (value: unknown, meta?: ColumnMeta): unknown => {
	const items = Array.isArray(value) ? value : [value];

	switch (meta?.arrayEncoding ?? DEFAULT_ARRAY_ENCODING) {
		case 'native':
			// Postgres takes the array itself; the driver handles the wire format.
			return items;
		case 'json':
			return JSON.stringify(items);
		default:
			return items.join(meta?.delimiter ?? DEFAULT_DELIMITER);
	}
};

export const decodeArray = (value: unknown, meta?: ColumnMeta): unknown[] => {
	switch (meta?.arrayEncoding ?? DEFAULT_ARRAY_ENCODING) {
		case 'native':
			return Array.isArray(value) ? value : [value];
		case 'json':
			return typeof value === 'string' ? JSON.parse(value) : (value as unknown[]);
		default: {
			const text = String(value);
			// An empty column is an empty list, not a list containing one empty string.
			return text.length ? text.split(meta?.delimiter ?? DEFAULT_DELIMITER) : [];
		}
	}
};

/**
 * Shared conversions that hold for every dialect once the driver is in string/UTC mode. A dialect
 * package spreads this and overrides only what it genuinely does differently.
 */
export const baseMarshaller: Marshaller = {
	toDatabase(value, type, meta) {
		if (value === null || value === undefined) return null;
		if (type === 'array') return encodeArray(value, meta);

		switch (type) {
			case 'bigint':
				return String(value);
			case 'json':
				return JSON.stringify(value);
			case 'date':
				return value instanceof Date ? value.toISOString().slice(0, 10) : value;
			case 'datetime':
				return value instanceof Date ? value.toISOString() : value;
			case 'uuid':
				return typeof value === 'string' ? value.toLowerCase() : value;
			default:
				return value;
		}
	},

	fromDatabase(value, type, meta) {
		if (value === null || value === undefined) return null;
		if (type === 'array') return decodeArray(value, meta);

		switch (type) {
			case 'bigint':
				// Deliberately a string, not a BigInt: JSON.stringify throws on BigInt, and the
				// existing generated entities already type these as strings.
				return String(value);
			case 'int':
			case 'float':
				return typeof value === 'number' ? value : Number(value);
			case 'boolean':
				// sqlite and mysql both hand back 0/1.
				return typeof value === 'boolean' ? value : Boolean(Number(value));
			case 'json':
				return typeof value === 'string' ? JSON.parse(value) : value;
			case 'date':
			case 'datetime':
				return value instanceof Date ? value : new Date(String(value));
			case 'uuid':
				// tedious hands these back uppercase, everyone else lowercase.
				return typeof value === 'string' ? value.toLowerCase() : value;
			default:
				return value;
		}
	},
};
