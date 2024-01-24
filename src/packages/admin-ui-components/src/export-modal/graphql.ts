import { gql } from '@apollo/client';
import { Entity, generateGqlSelectForEntityFields } from '../utils';
import pluralize from 'pluralize';

export const GetEntity = (entity: Entity, entityByType?: (entityType: string) => Entity) => {
	const pluralName = pluralize(entity.name);
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query getEntity ($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
		}
	`;
};
