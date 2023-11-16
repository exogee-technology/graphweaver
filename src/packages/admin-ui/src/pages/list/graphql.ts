import { gql } from '@apollo/client';
import { Entity, generateGqlSelectForEntityFields } from '@exogee/graphweaver-admin-ui-components';
import pluralize from 'pluralize';

export const queryForEntityPage = (entityName: string, entityByType: (type: string) => Entity) => {
	const entity = entityByType(entityName);
	const pluralName = pluralize(entity.name);
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query AdminUI${entityName}ListPage($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
		}
	`;
};
