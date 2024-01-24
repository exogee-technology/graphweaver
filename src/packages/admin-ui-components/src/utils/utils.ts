import { FieldFilter, Filter, SortField } from './use-schema';

export const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

export const getOrderByQuery = (sort?: SortField[]) => ({
	...(sort
		? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
		: { id: 'ASC' }),
});

export const getAndFiltersQuery = (filters: FieldFilter) => {
	const filter = Object.entries(filters)
		.map(([_, _filter]) => _filter)
		.filter((_filter): _filter is Filter => _filter !== undefined);

	if (filter.length === 0) return undefined;
	return { _and: filter };
};
