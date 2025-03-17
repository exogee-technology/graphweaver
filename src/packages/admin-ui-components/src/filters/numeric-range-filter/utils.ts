export const isDefined = <T>(value: T | undefined | null): value is T =>
	value !== undefined && value !== null;

export const getNumberOrUndefined = (value: unknown) => {
	if (!isDefined(value)) return undefined;
	if (typeof value === 'string' && value.trim().length === 0) return undefined;
	try {
		const number = Number(value);
		return isNaN(number) ? undefined : number;
	} catch (e) {
		console.error('Failed to parse number', e);
		return undefined;
	}
};
