export const processFormValues = (formValues: any) => {
	const result = Object.entries(formValues ?? []).reduce((acc, [key, value]: [string, any]) => {
		// Check if we have a relationship value if so let's only send the id to the server
		acc[key] =
			value && typeof value === 'object' && value.hasOwnProperty('value')
				? { id: value.value }
				: value;

		return acc;
	}, {} as Record<string, any>);

	return result;
};
