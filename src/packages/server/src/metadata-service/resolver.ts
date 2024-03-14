import {
	isSummaryField,
	isReadOnlyAdminUI,
	isReadOnlyPropertyAdminUI,
	AdminUISettingsMap,
	AdminUIFilterType,
	RelationshipType,
	BaseContext,
	getExportPageSize,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { Ctx, Query, Resolver } from 'type-graphql';
import { EnumMetadata } from 'type-graphql/dist/metadata/definitions';
import { AdminUiMetadata } from './metadata';
import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';
import { AdminMetadata } from '..';

const mapFilterType = (field: AdminUiFieldMetadata): AdminUIFilterType => {
	// Check if we have a relationship
	if (field.relationshipType) {
		return AdminUIFilterType.RELATIONSHIP;
	}

	// Check if we have an enum
	const isEnum = graphweaverMetadata.enums.find((value) => value.name === field.type);
	if (isEnum) return AdminUIFilterType.ENUM;

	// Otherwise check the type
	switch (field.type) {
		case 'ID':
			return AdminUIFilterType.TEXT;
		case 'Number':
			return AdminUIFilterType.NUMERIC;
		case 'String':
			return AdminUIFilterType.TEXT;
		case 'ISOString':
			return AdminUIFilterType.DATE_RANGE;
		case 'Boolean':
			return AdminUIFilterType.BOOLEAN;
		default:
			return AdminUIFilterType.TEXT;
	}
};

export const getAdminUiMetadataResolver = (hooks?: AdminMetadata['hooks']) => {
	@Resolver((of) => AdminUiMetadata)
	class AdminUiMetadataResolver {
		@Query(() => AdminUiMetadata, { name: '_graphweaver' })
		public async getAdminUiMetadata<C extends BaseContext>(@Ctx() context: C) {
			await hooks?.beforeRead?.({ context });

			const enumMetadata = new Map<object, EnumMetadata>();
			for (const registeredEnum of graphweaverMetadata.enums) {
				enumMetadata.set(registeredEnum.enumObj, registeredEnum);
			}

			const entities: (AdminUiEntityMetadata | undefined)[] = graphweaverMetadata.entities
				.map((entity) => {
					const name = entity.name;
					const adminUISettings = AdminUISettingsMap.get(name);
					const defaultFilter = adminUISettings?.entity?.defaultFilter;

					if (adminUISettings?.entity?.hideFromDisplay) {
						return;
					}

					const backendId = entity.provider?.backendId;
					const plural = entity.plural;

					const visibleFields = entity.fields.filter(
						(field) => !adminUISettings?.fields?.[field.name]?.hideFromDisplay
					);

					const summaryField = visibleFields.find((field) =>
						isSummaryField(entity.target, field.name)
					)?.name;

					const attributes = new AdminUiEntityAttributeMetadata();
					if (isReadOnlyAdminUI(entity.target)) {
						attributes.isReadOnly = true;
					}

					const exportPageSize = getExportPageSize(entity.target);
					if (exportPageSize) {
						attributes.exportPageSize = exportPageSize;
					}

					const fields = visibleFields?.map((field) => {
						const typeValue = field.getType() as { name: string };
						const typeName = typeValue.name ?? enumMetadata.get(typeValue)?.name;

						const relatedObject = graphweaverMetadata.hasEntity(typeName)
							? graphweaverMetadata.getEntity(typeName)
							: undefined;

						// Define field attributes
						const isReadOnly = isReadOnlyPropertyAdminUI(entity.target, field.name);
						const isRequired = !field.typeOptions.nullable;

						const fieldObject: AdminUiFieldMetadata = {
							name: field.name,
							type: relatedObject?.name || typeName,
							isArray: field.typeOptions.array,
							extensions: field.extensions || {},
							attributes: {
								isReadOnly,
								isRequired,
							},
						};

						// Check if we have an array of related entities
						if (field.typeOptions.array && relatedObject) {
							// Ok, it's a relationship to another object type that is an array, e.g. "to many".
							// We'll default to one to many, then if we can find a field on the other side that points
							// back to us and it's also an array, then it's a many to many.
							fieldObject.relatedEntity = relatedObject.name;
							fieldObject.relationshipType = RelationshipType.ONE_TO_MANY;

							const relatedEntityField = relatedObject.fields.find((field) => {
								const fieldType = field.getType() as { name?: string };
								return fieldType.name === entity.target.name;
							});
							if (relatedEntityField?.typeOptions.array) {
								fieldObject.relationshipType = RelationshipType.MANY_TO_MANY;
							}
						} else if (relatedObject) {
							fieldObject.relationshipType = RelationshipType.MANY_TO_ONE;
						}
						fieldObject.filter = adminUISettings?.fields?.[field.name]?.hideFromFilterBar
							? undefined
							: {
									type: mapFilterType(fieldObject),
							  };

						return fieldObject;
					});
					return {
						name,
						plural,
						defaultFilter,
						backendId,
						summaryField,
						fields,
						attributes,
					};
				})
				.filter((entity) => entity && !!entity.backendId);

			const enums = graphweaverMetadata.enums.map((registeredEnum) => ({
				name: registeredEnum.name,
				values: Object.entries(registeredEnum.enumObj).map(([name, value]) => ({
					name,
					value,
				})),
			}));

			const params = hooks?.afterRead
				? await hooks.afterRead({ context, metadata: { entities, enums } })
				: {
						metadata: { entities, enums },
				  };

			return params?.metadata;
		}
	}

	return AdminUiMetadataResolver;
};
