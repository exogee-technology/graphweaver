import { gql } from 'graphql-tag';

import { AggregationType, Entity } from '../utils/schema-types.js';
import { generateGqlSelectForEntityFields } from './select.js';

export const listEntityForExport = (
	entity: Entity,
	entityByType?: (entityType: string) => Entity
) => {
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);

	return gql`
		query ${entity.name}CsvExport($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(
					entity.fields.filter((field) => !field.hideInTable),
					entityByType
				)}
			}
			${entityCanCount ? `aggregate: ${queryName}_aggregate(filter: $filter) { count }` : ''}
		}
	`;
};
