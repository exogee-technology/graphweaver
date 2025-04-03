import { gql } from '@apollo/client';
import { Entity } from '../utils';

export const getRelationshipQuery = (entity: Entity) => {
	const queryName = entity.plural[0].toLowerCase() + entity.plural.slice(1);

	return gql`
		query getRelationship ($filter: ${entity.plural}ListFilter, $pagination: ${entity.plural}PaginationInput) {
			result: ${queryName} (filter: $filter, pagination: $pagination) {
				${entity.primaryKeyField}
				${entity.summaryField ? entity.summaryField : ''}
			}
		}
	`;
};

export const queryForFilterOptions = (entity: Entity, fieldName: string) => {
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query ${pluralName}FilterOptions {
			result: ${queryName} {
				${entity.primaryKeyField}
				${fieldName}
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
