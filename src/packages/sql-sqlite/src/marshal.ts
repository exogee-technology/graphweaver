import { baseMarshaller, type ColumnType, type Marshaller } from '@exogee/graphweaver-sql';

/**
 * SQLite stores five types and coerces everything else, so almost all of the work is on the way
 * out. Dates are stored as ISO-8601 UTC text, matching what MikroORM wrote, so existing databases
 * keep reading correctly.
 */
export const sqliteMarshaller: Marshaller = {
	...baseMarshaller,

	toDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'boolean':
				// No boolean type: 0 and 1, which is also what MikroORM wrote.
				return value ? 1 : 0;
			case 'bigint':
				return String(value);
			case 'decimal':
				// Kept as text rather than REAL, because REAL is a double and would silently lose
				// precision on anything that matters enough to be a decimal.
				return String(value);
			default:
				return baseMarshaller.toDatabase(value, type);
		}
	},

	fromDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'binary':
				return value instanceof Uint8Array ? Buffer.from(value) : value;
			case 'decimal':
				return String(value);
			default:
				return baseMarshaller.fromDatabase(value, type);
		}
	},
};
