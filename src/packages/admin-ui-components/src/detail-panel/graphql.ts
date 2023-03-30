import { gql } from '@apollo/client';
import pluralize from 'pluralize';
import { Entity } from '../utils';

export const generateUpdateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation updateEntity ($data: ${entity.name}CreateOrUpdateInput!){
      update${entity.name} (data: $data) {
        id
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
