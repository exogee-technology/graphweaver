import { baseMarshaller, type ColumnType, type Marshaller } from '@exogee/graphweaver-sql';

/**
 * Postgres is the best behaved of the four, largely because `pg` already hands back strings for
 * the types where a JS number would lose information.
 *
 * Note what is deliberately absent: any use of `pg.types.setTypeParser`. Those parsers are global
 * process state, so registering one here would silently change how every other piece of code in
 * the process reads its query results. All conversion happens in this object instead.
 */
export const postgresMarshaller: Marshaller = {
	...baseMarshaller,

	toDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'json':
				// pg sends an object as a record literal unless it is stringified first.
				return JSON.stringify(value);
			case 'decimal':
				return String(value);
			default:
				return baseMarshaller.toDatabase(value, type);
		}
	},

	fromDatabase(value: unknown, type: ColumnType) {
		if (value === null || value === undefined) return null;

		switch (type) {
			case 'json':
				// Already parsed by pg for json and jsonb.
				return typeof value === 'string' ? JSON.parse(value) : value;
			case 'decimal':
				// numeric arrives as a string, which is the whole point. Keep it one.
				return String(value);
			case 'date':
				// `date` comes back as a Date at local midnight, which shifts the day for anyone
				// west of UTC. Read the parts rather than the instant.
				if (value instanceof Date) {
					const year = String(value.getFullYear()).padStart(4, '0');
					const month = String(value.getMonth() + 1).padStart(2, '0');
					const day = String(value.getDate()).padStart(2, '0');
					return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
				}
				return baseMarshaller.fromDatabase(value, type);
			case 'binary':
				return value;
			default:
				return baseMarshaller.fromDatabase(value, type);
		}
	},
};
