import { Entity, SortField } from './use-schema';

export const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

type Sort = 'ASC' | 'DESC';

export const getOrderByQuery = ({
	primaryKeyField,
	sort,
	defaultSort,
}: {
	primaryKeyField?: string;
	sort?: SortField[];
	defaultSort?: { [k in string]: Sort };
}) => ({
	...(sort
		? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
		: defaultSort
			? defaultSort
			: primaryKeyField
				? { [primaryKeyField]: 'ASC' }
				: {}),
});
