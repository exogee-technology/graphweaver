import { gql } from '@apollo/client';
import { AggregationType, Entity, generateGqlSelectForEntityFields } from '../utils';

export type QueryResponse<TData> = {
	result: TData[];
	aggregate?: { count: number };
};

export const getEntityListQueryName = (entity: Entity) => {
	const pluralEntityName = entity.plural;
	return `${pluralEntityName}List`;
};

export const queryForEntityPage = (entityName: string, entityByType: (type: string) => Entity) => {
	const entity = entityByType(entityName);
	const pluralEntityName = entity.plural;
	const entityFieldName = pluralEntityName[0].toLowerCase() + pluralEntityName.slice(1);
	const queryName = getEntityListQueryName(entity);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);

	return gql`
		query ${queryName}($detailFilter: ${pluralEntityName}ListFilter, $countFilter: ${pluralEntityName}ListFilter, $pagination: ${pluralEntityName}PaginationInput) {
			result: ${entityFieldName}(filter: $detailFilter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
			${entityCanCount ? `aggregate: ${entityFieldName}_aggregate(filter: $countFilter) { count }` : ''}
		}
	`;
};
