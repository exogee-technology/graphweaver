import { gql } from '@apollo/client';
import { Entity, FieldFilter, getEntity, SortField } from '@exogee/graphweaver-admin-ui-components';
import pluralize from 'pluralize';

// @todo remove the below
// export const fetchList = <T>(
// 	entity: string,
// 	entityByNameOrType: (entity: string) => Entity,
// 	filterField?: FieldFilter,
// 	sortFields?: SortField[],
// 	page?: number
// ) =>
// 	getEntityPage<T>(
// 		entityByNameOrType(entity),
// 		filterField || {},
// 		sortFields || [],
// 		entityByNameOrType,
// 		page ?? 1
// 	);

// export const fetchEntity = <T>(
// 	entity: string,
// 	entityByNameOrType: (entity: string) => Entity,
// 	id?: string
// ) => (id ? getEntity<T>(entityByNameOrType(entity), id, entityByNameOrType) : undefined);

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
