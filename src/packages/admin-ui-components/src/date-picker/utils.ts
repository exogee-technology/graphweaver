import { DateTime } from 'luxon';

export const toLuxonDate = (date: Date | DateTime | string | undefined) => {
	if (DateTime.isDateTime(date)) return date;
	if (typeof date === 'string') return DateTime.fromISO(date);
	if (date instanceof Date) return DateTime.fromJSDate(date);
	return undefined;
};

export const setTime = (
	date: DateTime | string | undefined,
	time: DateTime | string | undefined,
	defaultTime: DateTime
) => {
	const dateLuxon = toLuxonDate(date);
	const timeDateLuxon = toLuxonDate(time) ?? defaultTime;
	if (!dateLuxon || !dateLuxon.isValid || !timeDateLuxon.isValid) return dateLuxon;
	return dateLuxon.set({
		hour: timeDateLuxon.hour,
		minute: timeDateLuxon.minute,
		second: timeDateLuxon.second,
	});
};

export const dateFormat = 'dd/MM/yyyy';
export const dateTimeFormat = 'dd/MM/yyyy HH:mm:ss';
export const getFormat = (withTime: boolean) => (withTime ? dateTimeFormat : dateFormat);
