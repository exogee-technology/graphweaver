import { gql } from '@apollo/client';
import pluralize from 'pluralize';

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
