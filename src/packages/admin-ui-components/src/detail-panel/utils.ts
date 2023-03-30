export const flattenRelationshipIds = (obj: Record<string, any>): Record<string, any> => {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}
	const result: Record<string, any> = {};
	for (const key in obj) {
		const value = obj[key];
		if (typeof value === 'object' && value !== null && 'id' in value) {
			result[key] = { id: value.id };
		} else {
			result[key] = flattenRelationshipIds(value);
		}
	}
	return result;
};
