import { gql } from 'graphql-tag';

import { Entity } from '../utils/schema-types.js';
import { generateGqlSelectForEntityFields } from './select.js';

export const generateUpdateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation Update${entity.name} ($input: ${entity.name}UpdateInput!){
      update${entity.name} (input: $input) {
        ${generateGqlSelectForEntityFields(
					entity.fields.filter((field) => !field.hideInDetailForm),
					entityByType
				)}
      }
    }
  `;

export const generateCreateEntityMutation = (
	entity: Entity,
	entityByType: (entityType: string) => Entity
) => gql`
    mutation Create${entity.name} ($input: ${entity.name}InsertInput!){
      create${entity.name} (input: $input) {
        ${generateGqlSelectForEntityFields(
					entity.fields.filter((field) => !field.hideInDetailForm),
					entityByType
				)}
      }
    }
  `;

export const generateDeleteEntityMutation = (entity: Entity) => gql`
    mutation Delete${entity.name} ($id: ID!){
      delete${entity.name} (${entity.primaryKeyField}: $id)
    }
  `;

export const generateDeleteManyEntitiesMutation = (entity: Entity) => gql`
mutation Delete${entity.plural} ($ids: [ID!]!){
  delete${entity.plural} (filter: { ${entity.primaryKeyField}_in: $ids })
}
`;

export const getRelationshipQuery = (entity: Entity) => {
	const { plural, summaryField, primaryKeyField } = entity;
	const queryName = plural[0].toLowerCase() + plural.slice(1);

	return gql`
    query ${entity.name}Relationship ($filter: ${plural}ListFilter, $pagination: ${plural}PaginationInput) {
      result: ${queryName} (filter: $filter, pagination: $pagination) {
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

export const getRelationshipCountQuery = (entity: Entity) => {
	const { plural } = entity;
	const queryName = `${plural[0].toLowerCase()}${plural.slice(1)}_aggregate`;

	return gql`
		query ${entity.name}RelationshipCount ($filter: ${plural}ListFilter) {
			result: ${queryName} (filter: $filter) { count }
		}
	`;
};
