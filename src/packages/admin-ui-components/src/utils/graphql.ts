import { gql } from '@apollo/client';
import { Entity } from './use-schema';

export const SCHEMA_QUERY = gql`
	query GraphweaverMetadata {
		result: _graphweaver {
			entities {
				name
				plural
				backendId
				backendDisplayName
				excludeFromTracing
				summaryField
				fieldForDetailPanelNavigationId
				primaryKeyField
				defaultFilter
				defaultSort
				hideInSideBar
				supportedAggregationTypes
				supportsPseudoCursorPagination
				fields {
					name
					type
					isArray
					relationshipType
					relatedEntity
					filter {
						type
						options
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
					detailPanelInputComponent {
						name
						options
					}
				}
				attributes {
					isReadOnly
					exportPageSize
					clientGeneratedPrimaryKeys
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
		.filter((field) => !field.hideInTable)
		.map((field) => {
			if (field.type === 'GraphweaverMedia') {
				return `${field.name} { filename, type, url }`;
			} else if (field.relationshipType) {
				if (!entityByType) {
					throw new Error('entityByType is required for relationship fields');
				}
				const relatedEntity = entityByType(field.type);
				if (!relatedEntity) throw new Error(`Related entity ${field.type} not found`);

				return `${field.name} { 
					value: ${relatedEntity.primaryKeyField}
					label: ${relatedEntity?.summaryField ?? relatedEntity?.primaryKeyField}
				}`;
			}

			return field.name;
		})
		.join(' ');
