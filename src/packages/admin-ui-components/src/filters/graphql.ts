import { gql } from '@apollo/client';
import { Entity } from '../utils';

export const getRelationshipQuery = (entity?: Entity) => {
	if (!entity) return;

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

export const getFilterOptionsQuery = (entity: Entity | undefined, fieldName: string) => {
	if (!entity) return;

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

export const fragmentForDisplayValueOfEntity = (entity?: Entity) => {
	if (!entity) {
		return {
			fragmentName: 'EmptyFragment',
			fragment: gql`
				fragment EmptyFragment on Empty {
					id
				}
			`,
		};
	}

	return {
		fragmentName: `${entity.name}DisplayValue`,
		fragment: gql`
			fragment ${entity.name}DisplayValue on ${entity.name} {
				${entity.primaryKeyField}
				${entity.summaryField ?? ''}
			}
		`,
	};
};
