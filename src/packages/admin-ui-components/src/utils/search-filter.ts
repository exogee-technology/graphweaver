import { EntityField, Filter } from './index';

export const substringOperatorForField = (fieldMetadata: EntityField) =>
	fieldMetadata.filter?.options?.caseInsensitive ? 'ilike' : 'like';

export const substringFilterForFields = (
	fieldMetadata: EntityField[],
	inputValue: string,
	additionalFilter?: Filter
): Filter | undefined => {
	let searchTermFilter: Filter | undefined;
	if (inputValue && fieldMetadata.length === 1) {
		searchTermFilter = {
			[`${fieldMetadata[0].name}_${substringOperatorForField(fieldMetadata[0])}`]: `%${inputValue}%`,
		};
	} else if (inputValue) {
		searchTermFilter = {
			// We are intentionally not passing in the additional filter here because
			// we want to search all fields for the search term and not add the additional filter
			// to each field.
			_or: fieldMetadata.map((fieldMetadata) =>
				substringFilterForFields([fieldMetadata], inputValue)
			),
		};
	}

	if (searchTermFilter && !additionalFilter) return searchTermFilter;
	else if (!searchTermFilter && additionalFilter) return additionalFilter;
	else if (!searchTermFilter && !additionalFilter) return;
	else return { _and: [searchTermFilter, additionalFilter] };
};
