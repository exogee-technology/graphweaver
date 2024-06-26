import { gql } from '@apollo/client';
import { Entity } from './use-schema';

export const SCHEMA_QUERY = gql`
	query GraphweaverMetadata {
		result: _graphweaver {
			entities {
				name
				plural
				backendId
				summaryField
				primaryKeyField
				defaultFilter
				defaultSort
				hideInSideBar
				supportedAggregationTypes
				fields {
					name
					type
					isArray
					relationshipType
					relatedEntity
					filter {
						type
					}
					attributes {
						isReadOnly
						isRequired
					}
					extensions {
						key
					}
					hideInTable
					hideInFilterBar
				}
				attributes {
					isReadOnly
					exportPageSize
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
					throw new Error('entityByType is required for relationship fields');
				}
				const relatedEntity = entityByType(field.type);
				if (!relatedEntity) throw new Error(`Related entity ${field.type} not found`);

				return `${field.name} { 
					value: ${relatedEntity.primaryKeyField}
					label: ${relatedEntity?.summaryField ?? relatedEntity?.primaryKeyField}
				}`;
			} else {
				if (field.type === 'Media') {
					return `${field.name} { filename, type, url }`;
				}
				return field.name;
			}
		})
		.join(' ');
