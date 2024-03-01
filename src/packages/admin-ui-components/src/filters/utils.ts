import { AdminUIFilterType, EntityField, Filter } from '../utils';

const getValidFilterProperties = (fields: EntityField[]): Set<string> => {
	// This is a list of all the supported filter keys for this entity
	const supportedKeys = new Set<string>();
	for (const field of fields) {
		switch (field.filter?.type) {
			case AdminUIFilterType.TEXT:
				supportedKeys.add(field.name);
				supportedKeys.add(`${field.name}_in`);
				break;
			case AdminUIFilterType.BOOLEAN:
				supportedKeys.add(field.name);
				break;
			case AdminUIFilterType.RELATIONSHIP:
				supportedKeys.add(field.name);
				break;
			case AdminUIFilterType.ENUM:
				supportedKeys.add(`${field.name}_in`);
				break;
			case AdminUIFilterType.NUMERIC:
				supportedKeys.add(field.name);
				break;
			case AdminUIFilterType.DATE_RANGE:
				supportedKeys.add(`${field.name}_gte`);
				supportedKeys.add(`${field.name}_lte`);
				break;
		}
	}

	return supportedKeys;
};

// Check entity fields for supported filter keys and remove any unsupported keys from the filter
export const validateFilter = (
	fields: EntityField[],
	filter?: Filter
): { filter?: Filter; unsupportedKeys: string[] } => {
	if (!filter) return { filter: undefined, unsupportedKeys: [] };

	// This is a list of all the supported filter keys for this entity
	const supportedKeys = getValidFilterProperties(fields);

	// This is a list of all the keys in the filter that are not supported
	const unsupportedKeys = Object.keys(filter).filter((key) => !supportedKeys.has(key));

	// Create a copy of the filter
	const validFilter = { ...filter };

	// Remove any unsupported keys from the filter
	for (const key of unsupportedKeys) {
		delete validFilter[key];
	}

	return {
		filter: validFilter,
		unsupportedKeys,
	};
};
