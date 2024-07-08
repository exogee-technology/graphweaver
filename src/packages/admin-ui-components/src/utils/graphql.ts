import { gql } from '@apollo/client';
import { Entity } from './use-schema';
import { federationNameForEntity } from './utils';

export const SCHEMA_QUERY = gql`
	query GraphweaverMetadata {
		result: _graphweaver {
			federationSubgraphName
			entities {
				name
				plural
				backendId
				excludeFromTracing
				summaryField
				fieldForDetailPanel
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
					hideInDetailForm
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
	entityByType?: (entityType: string) => Entity,
	federationSubgraphName?: string
) =>
	entity.fields
		.filter((field) => !field.hideInTable)
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
				if (field.type === federationNameForEntity('Media', federationSubgraphName)) {
					return `${field.name} { filename, type, url }`;
				}
				return field.name;
			}
		})
		.join(' ');
