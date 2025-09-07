import { gql } from '@apollo/client';
import { Entity, EntityField } from './use-schema';

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
					format {
						type
						timezone
						format
						variant
					}
					attributes {
						isReadOnly
						isRequiredForCreate
						isRequiredForUpdate
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

const entitySelection = (relatedEntity: Entity) => 
	[relatedEntity.primaryKeyField].concat(relatedEntity.summaryField ?? []).join('\n');

export const generateGqlSelectForEntityFields = (
	fields: EntityField[],
	entityByType?: (entityType: string) => Entity
) =>
	fields
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
					${entitySelection(relatedEntity)}
				}`;
			}

			return field.name;
		})
		.join(' ');
