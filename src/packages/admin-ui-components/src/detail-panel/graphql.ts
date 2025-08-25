import { gql } from '@apollo/client';
import { Entity, generateGqlSelectForEntityFields } from '../utils';

export const generateUpdateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation updateEntity ($input: ${entity.name}UpdateInput!){
      update${entity.name} (input: $input) {
        ${generateGqlSelectForEntityFields(entity.fields.filter((field) => !field.hideInDetailForm), entityByType)}
      }
    }
  `;

export const generateCreateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation createEntity ($input: ${entity.name}InsertInput!){
      create${entity.name} (input: $input) {
        ${generateGqlSelectForEntityFields(entity.fields.filter((field) => !field.hideInDetailForm), entityByType)}
      }
    }
  `;

export const generateDeleteEntityMutation = (entity: Entity) => gql`
    mutation deleteEntity ($id: ID!){
      delete${entity.name} (${entity.primaryKeyField}: $id)
    }
  `;

export const generateDeleteManyEntitiesMutation = (entity: Entity) => gql`
mutation deleteManyEntities ($ids: [ID!]!){
  delete${entity.plural} (filter: { ${entity.primaryKeyField}_in: $ids })
}
`;

export const getRelationshipQuery = (entity: Entity) => {
	const { plural, summaryField, primaryKeyField } = entity;
	const queryName = plural[0].toLowerCase() + plural.slice(1);

	return gql`
    query getRelationship ($pagination: ${plural}PaginationInput) {
      result: ${queryName} (pagination: $pagination) {
        ${primaryKeyField}
        ${summaryField ? summaryField : ''}
      }
    }
  `;
};

export const getUploadUrlMutation = gql`
	mutation GetUploadUrl($key: String!) {
		getUploadUrl(key: $key)
	}
`;

export const getDeleteUrlMutation = gql`
	mutation GetDeleteUrl($key: String!) {
		getDeleteUrl(key: $key)
	}
`;
