type ObjectWithId = {
	id: string;
};

const hasId = (obj: unknown): obj is ObjectWithId => {
	return typeof (obj as ObjectWithId).id === 'string';
};

const isObject = (value: unknown) => {
	return value != null && typeof value === 'object';
};

export const inMemoryFilterFor = (filter: Record<string, any>) => (item: Record<string, any>) => {
	for (const [filterKey, filterValue] of Object.entries(filter || {})) {
		if (filterKey === '_or') {
			for (const condition of filterValue) {
				if (inMemoryFilterFor(condition)(item)) return true;
			}
			return false;
		} else if (filterKey === '_and') {
			for (const condition of filterValue) {
				if (!inMemoryFilterFor(condition)(item)) return false;
			}
			return true;
		} else if (isObject(filterValue) && hasId(filterValue)) {
			// If we have an filter with an object and an ID then flatten the object and map it
			// For example: { account: { id: '123' } } to { accountId: '123' }
			return filterValue?.id === item?.[`${filterKey}Id`];
		} else {
			if (
				item[filterKey] === null ||
				item[filterKey] === undefined ||
				item[filterKey] !== filterValue
			) {
				return false;
			}
		}
	}
	return true;
};
