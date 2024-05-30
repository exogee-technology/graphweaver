import { Entity, SortField } from './use-schema';

export const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

export const getOrderByQuery = (entity: Entity, sort?: SortField[]) => ({
	...(sort
		? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
		: { [entity.primaryKeyField]: 'ASC' }),
});
