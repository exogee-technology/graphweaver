import { SortEntity } from './use-schema';

export const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

export const getOrderByQuery = ({
	primaryKeyField,
	sort,
	defaultSort,
}: {
	primaryKeyField?: string;
	sort?: SortEntity;
	defaultSort?: SortEntity;
}) => ({
	...(sort
		? Array.isArray(sort)
			? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
			: sort
		: defaultSort
			? defaultSort
			: primaryKeyField
				? { [primaryKeyField]: 'ASC' }
				: {}),
});

export const federationNameForEntity = (entityName: string, federationSubgraphName?: string) => {
	if (!federationSubgraphName) return entityName;

	return `${entityName}From${federationSubgraphName.charAt(0).toUpperCase() + federationSubgraphName.slice(1)}Subgraph`;
};
