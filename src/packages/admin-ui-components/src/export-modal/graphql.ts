import { gql } from '@apollo/client';
import { AggregationType, Entity, generateGqlSelectForEntityFields } from '../utils';

export const listEntityForExport = (
	entity: Entity,
	entityByType?: (entityType: string) => Entity
) => {
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);

	return gql`
		query entityCSVExport($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
			${entityCanCount ? `aggregate: ${queryName}_aggregate(filter: $filter) { count }` : ''}
		}
	`;
};
