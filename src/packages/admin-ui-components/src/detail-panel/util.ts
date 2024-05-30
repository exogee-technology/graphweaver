// This is used to validate if a value is empty in the context of a form
export const isValueEmpty = (value: unknown) =>
	value === '' || value === null || value === undefined;
