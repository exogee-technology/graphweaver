import { gql } from '@apollo/client';
import { Entity } from '@exogee/graphweaver-admin-ui-components';
import pluralize from 'pluralize';

export const queryForEntityPage = (entityName: string, entityByType: (type: string) => Entity) => {
	const entity = entityByType(entityName);
	const pluralName = pluralize(entity.name);
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query AdminUIListPage($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${entity.fields
					.map((field) => {
						if (field.relationshipType) {
							const relatedEntity = entityByType(field.type);
							return `${field.name} { id ${relatedEntity.summaryField || ''} }`;
						} else {
							return field.name;
						}
					})
					.join(' ')}
			}
		}
	`;
};
