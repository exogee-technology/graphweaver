import { gql } from '@apollo/client';
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
