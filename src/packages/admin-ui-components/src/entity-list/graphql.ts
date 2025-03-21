import { gql } from '@apollo/client';
import { AggregationType, Entity, generateGqlSelectForEntityFields } from '../utils';

export type QueryResponse<TData> = {
	result: TData[];
	aggregate?: { count: number };
};

export const queryForEntityPage = (entityName: string, entityByType: (type: string) => Entity) => {
	const entity = entityByType(entityName);
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);

	return gql`
		query ${pluralName}List($detailFilter: ${pluralName}ListFilter, $countFilter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $detailFilter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
			${entityCanCount ? `aggregate: ${queryName}_aggregate(filter: $countFilter) { count }` : ''}
		}
	`;
};
