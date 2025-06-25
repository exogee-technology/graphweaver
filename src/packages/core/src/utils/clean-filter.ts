import { Filter } from '../types';

export const cleanFilter = <G>(filter: Filter<G> | undefined): Filter<G> | undefined => {
	if (filter == null) return undefined;

	// If it's not an object, return as is
	if (typeof filter !== 'object' || Array.isArray(filter)) {
		return filter;
	}

	const cleanedFilter: any = {};
	let hasValidProperty = false;

	for (const [key, value] of Object.entries(filter)) {
		// Skip only undefined values, preserve null values as they are valid filter criteria
		if (value === undefined) continue;

		// Handle _and and _or arrays
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			// Recursively clean each item in the array
			const cleanedItems = value.map((item) => cleanFilter(item)).filter((item) => item != null); // Remove null/undefined results

			// If no valid items remain, skip this property
			if (cleanedItems.length === 0) continue;

			// If only one item remains, hoist it up instead of keeping the array
			if (cleanedItems.length === 1) {
				// Merge the single item into the current filter instead of using _and/_or
				const singleItem = cleanedItems[0];
				if (typeof singleItem === 'object' && !Array.isArray(singleItem)) {
					Object.assign(cleanedFilter, singleItem);
					hasValidProperty = true;
					continue;
				}
			}

			// Multiple items remain, keep the array
			cleanedFilter[key] = cleanedItems;
			hasValidProperty = true;
		} else if (Array.isArray(value)) {
			// Handle regular arrays (not _and/_or) - clean them by removing null/undefined values
			const cleanedArray = value.filter((item) => item != null);

			// If the array becomes empty, skip this property
			if (cleanedArray.length === 0) continue;

			cleanedFilter[key] = cleanedArray;
			hasValidProperty = true;
		} else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
			// Recursively clean nested objects
			const cleanedValue = cleanFilter(value);
			if (cleanedValue != null) {
				cleanedFilter[key] = cleanedValue;
				hasValidProperty = true;
			}
		} else {
			// Keep all other primitive values as they are
			cleanedFilter[key] = value;
			hasValidProperty = true;
		}
	}

	// Return undefined if no valid properties remain
	return hasValidProperty ? cleanedFilter : undefined;
};
