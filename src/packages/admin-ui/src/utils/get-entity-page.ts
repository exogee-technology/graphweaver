import { Entity } from './use-schema';
import { request, gql } from 'graphql-request';
import pluralize from 'pluralize';
import { SortColumn } from 'react-data-grid';

const PAGE_SIZE = 100;

export const getEntityPage = <T>(
	entity: Entity,
	sortColumns: readonly SortColumn[],
	entityByType: (type: string) => Entity,
	page: number
) => {
	const query = queryForEntity(entity, entityByType);

	const orderBy: { [field: string]: 'ASC' | 'DESC' } = {};
	for (const sortColumn of sortColumns) {
		orderBy[sortColumn.columnKey] = sortColumn.direction;
	}

	return request('http://localhost:3000/graphql/v1', query, {
		pagination: {
			offset: page * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy,
		},
	});
};

const queryForEntity = (entity: Entity, entityByType: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThings.
	const pluralName = pluralize(entity.name);
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query AdminUIListPage($pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(pagination: $pagination) {
				${entity.fields
					.map((field) => {
						if (field.relationshipType) {
							const relatedEntity = entityByType(field.type);
							return `${field.name} { id ${relatedEntity.summaryField || ''} }`;
						}
						return field.name;
					})
					.join(' ')}
			}
		}
	`;
};
