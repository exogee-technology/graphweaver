import { gql } from '@apollo/client';
import pluralize from 'pluralize';
import { Entity } from '../utils';

export const getRelationshipQuery = (entityName: string, summaryField?: string) => {
	const pluralName = pluralize(entityName);
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
	const pluralName = pluralize(entity.name);
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
