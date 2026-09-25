import { baseMarshaller, type ColumnType, type Marshaller } from '@exogee/graphweaver-sql';

/**
 * MySQL is the dialect where the driver's defaults do the most damage, so the driver is configured
 * to hand back strings for everything ambiguous and all conversion happens here.
 */
export const mysqlMarshaller: Marshaller = {
	...baseMarshaller,

	toDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'boolean':
				// TINYINT(1) or BIT(1), both of which take a 1 or a 0.
				return value ? 1 : 0;
			case 'json':
				return JSON.stringify(value);
			case 'decimal':
				return String(value);
			case 'datetime':
				// With timezone: 'Z' the server is on UTC, so send a UTC string rather than a Date
				// and leave nothing for the driver to reinterpret.
				return value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : value;
			case 'date':
				return value instanceof Date ? value.toISOString().slice(0, 10) : value;
			default:
				return baseMarshaller.toDatabase(value, type);
		}
	},

	fromDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'boolean':
				// A BIT column comes back as a Buffer, whose Number() is NaN -- which made every BIT(1)
				// false. It is true when any bit is set.
				if (value instanceof Uint8Array) return value.some((byte) => byte !== 0);
				return Boolean(Number(value));
			case 'decimal':
				// decimalNumbers is off, so this arrives as a string. Keep it one.
				return String(value);
			case 'datetime':
				// dateStrings is on, so this is 'YYYY-MM-DD HH:MM:SS' in UTC.
				return typeof value === 'string' ? new Date(`${value.replace(' ', 'T')}Z`) : value;
			case 'date':
				return typeof value === 'string' ? new Date(`${value}T00:00:00.000Z`) : value;
			case 'binary':
				return value;
			default:
				return baseMarshaller.fromDatabase(value, type);
		}
	},
};
