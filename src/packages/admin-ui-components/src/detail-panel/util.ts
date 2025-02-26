// This is used to validate if a value is empty in the context of a form
export const isValueEmpty = (value: unknown) =>
	value === '' || value === null || value === undefined;

/**
 * Value should not be undefined because the input that renders it will switch from uncontrolled to controlled and React will throw an error.
 * Also, if value is a JSON object, we stringify it.
 */
export const parseValueForForm = (fieldType: string, value: unknown) => {
	if (value === undefined) {
		return null;
	}

	if (fieldType === 'JSON' && value) {
		return JSON.stringify(value, null, 4);
	}

	return value;
};
