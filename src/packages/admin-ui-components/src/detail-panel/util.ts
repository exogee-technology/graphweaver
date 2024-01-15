export const mapFormikValuesToGqlRequestValues = (formValues: any) => {
	const result = Object.entries(formValues ?? []).reduce((acc, [key, value]: [string, any]) => {
		// Check if we have a relationship value if so let's only send the id to the server
		if (Array.isArray(value)) {
			// Multi-select fields will be an array of objects, each with a value and label
			// Map over each object in the array and create a { id: record_id } object
			acc[key] = value.map((item) =>
				item && typeof item === 'object' && item.hasOwnProperty('value') ? { id: item.value } : item
			);
		} else if (value && typeof value === 'object' && value.hasOwnProperty('value')) {
			// Single select fields will be an object with the ID as the value and a human readable 'label' attribute
			// Extract out a simple { id: record_id } boject
			acc[key] = { id: value.value };
		} else {
			// Otherwise just pass the value through
			acc[key] = value;
		}

		return acc;
	}, {} as Record<string, any>);

	return result;
};
