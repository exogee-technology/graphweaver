export const isDefined = <T>(value: T | undefined | null): value is T =>
	value !== undefined && value !== null;
