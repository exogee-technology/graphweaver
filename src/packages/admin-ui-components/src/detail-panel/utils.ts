export const formatInputForRelationships = (obj: Record<string, any>): Record<string, any> => {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}
	const result: Record<string, any> = {};
	for (const key in obj) {
		const value = obj[key];
		if (typeof value === 'object' && value !== null && 'value' in value) {
			result[key] = { id: value.value };
		} else {
			result[key] = formatInputForRelationships(value);
		}
	}
	return result;
};
