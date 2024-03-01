import { AdminUIFilterType, EntityField, Filter } from '../utils';

const getListOfSupportedFilterKeys = (fields: EntityField[]): string[] => {
	// list of supported keys
	const supportedKeys = [];
	for (const field of fields) {
		switch (field.filter?.type) {
			case AdminUIFilterType.TEXT:
				supportedKeys.push(field.name);
				supportedKeys.push(`${field.name}_in`);
				break;
			case AdminUIFilterType.BOOLEAN:
				supportedKeys.push(field.name);
				break;
			case AdminUIFilterType.RELATIONSHIP:
				supportedKeys.push(field.name);
				break;
			case AdminUIFilterType.ENUM:
				supportedKeys.push(`${field.name}_in`);
				break;
			case AdminUIFilterType.NUMERIC:
				supportedKeys.push(field.name);
				break;
			case AdminUIFilterType.DATE_RANGE:
				supportedKeys.push(`${field.name}_gte`);
				supportedKeys.push(`${field.name}_lte`);
				break;
		}
	}

	return supportedKeys;
};

const filterUnsupportedKeys = (supportedKeys: string[], filter?: Filter): string[] => {
	const unSupportedKeys: string[] = [];
	Object.keys(filter || {}).forEach((key) => {
		if (!supportedKeys.includes(key)) {
			unSupportedKeys.push(key);
		}
	});
	return unSupportedKeys;
};

// Check entity fields for supported filters
export const checkAndCleanFilter = (
	fields: EntityField[],
	filter?: Filter
): { filter: Filter; unsupportedKeys: string[] } => {
	const supportedKeys = getListOfSupportedFilterKeys(fields);
	const unsupportedKeys = filterUnsupportedKeys(supportedKeys, filter);
	const supportedFilter = { ...filter };
	unsupportedKeys.forEach((key) => {
		delete supportedFilter[key];
	});
	return {
		filter: supportedFilter,
		unsupportedKeys,
	};
};
