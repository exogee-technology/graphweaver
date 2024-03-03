import { gql } from '@apollo/client';
import { Entity } from '../utils';

export const getRelationshipQuery = (pluralName: string, summaryField?: string) => {
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
    query getRelationship ($pagination: ${pluralName}PaginationInput) {
      result: ${queryName} (pagination: $pagination) {
        id
        ${summaryField ? summaryField : ''}
      }
    }
  `;
};

export const queryForFilterText = (
	entityName: string,
	fieldName: string,
	entityByType: (type: string) => Entity
) => {
	const entity = entityByType(entityName);
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	return gql`
		query TextFilter {
			result: ${queryName} {
				id
        ${fieldName}
			}
		}
	`;
};
