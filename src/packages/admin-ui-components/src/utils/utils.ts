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
		? sort.reduce(
				(acc, { field, direction }) => {
					acc[field] = direction;
					return acc;
				},
				{} as Record<string, 'ASC' | 'DESC'>
			)
		: { [entity.primaryKeyField]: 'ASC' }),
});

export const federationNameForEntity = (entityName: string, federationSubgraphName?: string) => {
	if (!federationSubgraphName) return entityName;

	return `${entityName}From${federationSubgraphName.charAt(0).toUpperCase() + federationSubgraphName.slice(1)}Subgraph`;
};
