import { gql } from '@apollo/client';
import { Entity } from '../utils';

export const getRelationshipQuery = (entity: Entity) => {
	const queryName = entity.plural[0].toLowerCase() + entity.plural.slice(1);

	return gql`
		query getRelationship ($pagination: ${entity.plural}PaginationInput) {
			result: ${queryName} (pagination: $pagination) {
				${entity.primaryKeyField}
				${entity.summaryField ? entity.summaryField : ''}
			}
		}
	`;
};

export const queryForFilterText = (entity: Entity, fieldName: string) => {
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query TextFilter {
			result: ${queryName} {
				${entity.primaryKeyField}
				${fieldName}
			}
		}
	`;
};
