export * from './date-serializer';

export interface Serializer {
	fromCrm: (value: unknown) => any;
	toCrm: (value: unknown) => any;
}
