import { DateTime } from 'luxon';

// This represents the concept of a fixed date (e.g. my birthday is January 1st regardless of timezone), as opposed
// to a date time (e.g. this event occured at 10am Sydney time). Unfortunately CRM stores these as timestamps
// anyway, so we have to deal with both.
export const DateSerializer = {
	fromCrm: (value: unknown) => {
		if (typeof value !== 'string') {
			throw new Error(`Date serializer can only parse strings. Got ${typeof value}.`);
		}

		const result = DateTime.fromISO(value);
		if (!result.isValid) {
			throw new Error(`Got invalid date string: '${value}'.`);
		}

		return result.toISODate();
	},

	toCrm: (value: unknown) => {
		if (typeof value !== 'string') {
			throw new Error(`Expected string, got ${value}`);
		}
		if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
			throw new Error(`Unable to parse string in DateSerializer. Got '${value}'`);
		}

		return value;
	},
};
