import { gql } from '@apollo/client';
import { Entity } from './use-schema';

export const SCHEMA_QUERY = gql`
	{
		result: _graphweaver {
			entities {
				name
				backendId
				summaryField
				fields {
					name
					type
					relationshipType
					relatedEntity
					filter {
						type
					}
				}
			}
			enums {
				name
				values {
					name
					value
				}
			}
		}
	}
`;

export const generateGqlSelectForEntityFields = (
	entity: Entity,
	entityByType?: (entityType: string) => Entity
) =>
	entity.fields
		.map((field) => {
			if (field.relationshipType) {
				if (!entityByType) {
					return `${field.name} { id }`;
				}
				const relatedEntity = entityByType(field.type);
				return `${field.name} { id ${relatedEntity.summaryField || ''} }`;
			} else {
				return field.name;
			}
		})
		.join(' ');
