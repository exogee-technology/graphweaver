import { gql } from '@apollo/client';
import pluralize from 'pluralize';
import { Entity, generateGqlSelectForEntityFields } from '../utils';

export const generateUpdateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation updateEntity ($data: ${entity.name}CreateOrUpdateInput!){
      update${entity.name} (data: $data) {
        id
        ${generateGqlSelectForEntityFields(entity, entityByType)}
      }
    }
  `;

export const generateCreateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation createEntity ($data: ${entity.name}InsertInput!){
      create${entity.name} (data: $data) {
        id
        ${generateGqlSelectForEntityFields(entity, entityByType)}
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
