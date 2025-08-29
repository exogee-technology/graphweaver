import { gql } from '@apollo/client';
import { Entity } from '../utils';

export const getRelationshipQuery = (entity: Entity) => {
	const queryName = entity.plural[0].toLowerCase() + entity.plural.slice(1);

	return gql`
		query getRelationship ($filter: ${entity.plural}ListFilter, $pagination: ${entity.plural}PaginationInput) {
			result: ${queryName} (filter: $filter, pagination: $pagination) {
				${entity.primaryKeyField}
				${entity.summaryField ?? ''}
			}
		}
	`;
};

export const getFilterOptionsQuery = (entity: Entity, fieldName: string) => {
	const queryName = entity.plural[0].toLowerCase() + entity.plural.slice(1);

	return gql`
		query getFilterOptions ($filter: ${entity.plural}ListFilter, $pagination: ${entity.plural}PaginationInput) {
			result: ${queryName} (filter: $filter, pagination: $pagination) {
				${entity.primaryKeyField}
				${fieldName !== entity.primaryKeyField ? fieldName : ''}
			}
		}
	`;
};

export const fragmentForDisplayValueOfEntity = (entity: Entity) => ({
	fragmentName: `${entity.name}DisplayValue`,
	fragment: gql`
		fragment ${entity.name}DisplayValue on ${entity.name} {
			${entity.primaryKeyField}
			${entity.summaryField}
		}
	`,
});
