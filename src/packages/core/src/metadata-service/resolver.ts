import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';

import {
	AdminUIFilterType,
	RelationshipType,
	BaseContext,
	getExportPageSize,
	graphweaverMetadata,
} from '..';

const mapFilterType = (field: AdminUiFieldMetadata): AdminUIFilterType => {
	// Check if we have a relationship
	if (field.relationshipType) {
		return AdminUIFilterType.RELATIONSHIP;
	}

	// Check if we have an enum
	if (graphweaverMetadata.getEnumByName(field.type)) return AdminUIFilterType.ENUM;

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

type MetadataHookParams<C> = {
	context: C;
	metadata?: { entities: any; enums: any };
};

type Hooks = {
	beforeRead?: <C extends BaseContext>(
		params: MetadataHookParams<C>
	) => Promise<MetadataHookParams<C>>;
	afterRead?: <C extends BaseContext>(
		params: MetadataHookParams<C>
	) => Promise<MetadataHookParams<C>>;
};

export const resolveAdminUiMetadata = (hooks?: Hooks) => {
	return async <C extends BaseContext>(source: unknown, args: unknown, context: C) => {
		await hooks?.beforeRead?.({ context });

		const entities: (AdminUiEntityMetadata | undefined)[] = Array.from(
			graphweaverMetadata.entities()
		)
			.map((entity) => {
				const { name, adminUIOptions } = entity;

				// If the entity is hidden from the display, return undefined
				// so that it won't show up in the metadata.
				if (adminUIOptions?.hideInSideBar) return;

				const backendId = entity.provider?.backendId;
				const plural = entity.plural;

				const visibleFields = Object.values(entity.fields).filter(
					(field) => !field.adminUIOptions?.hideInTable
				);

				const attributes = new AdminUiEntityAttributeMetadata();
				attributes.isReadOnly = entity.adminUIOptions?.readonly;
				attributes.exportPageSize = getExportPageSize(entity.target);

				let defaultSummaryField: 'name' | 'title' | undefined = undefined;

				const fields = visibleFields?.map((field) => {
					const fieldType = field.getType();
					const isArray = Array.isArray(fieldType);
					const relatedObject = graphweaverMetadata.metadataForType(fieldType);
					const typeName = isArray ? fieldType[0].name : (fieldType as any).name;

					// set the default summary field
					if (['name', 'title'].includes(field.name))
						defaultSummaryField = field.name as 'name' | 'title';

					// Define field attributes
					const isReadOnly = field.readonly ?? field.adminUIOptions?.readonly ?? false;
					const isRequired = !field.nullable;

					const fieldObject: AdminUiFieldMetadata = {
						name: field.name,
						type: relatedObject?.name || typeName,
						isArray,
						attributes: {
							isReadOnly,
							isRequired,
						},
					};

					// Check if we have an array of related entities
					if (isArray && relatedObject?.type === 'entity') {
						// Ok, it's a relationship to another object type that is an array, e.g. "to many".
						// We'll default to one to many, then if we can find a field on the other side that points
						// back to us and it's also an array, then it's a many to many.
						fieldObject.relatedEntity = relatedObject.name;
						fieldObject.relationshipType = RelationshipType.ONE_TO_MANY;

						const relatedEntityField = Object.values(relatedObject.fields).find((field) => {
							const fieldType = field.getType() as { name?: string };
							return fieldType.name === (entity.target as { name?: string }).name;
						});
						if (Array.isArray(relatedEntityField?.getType())) {
							fieldObject.relationshipType = RelationshipType.MANY_TO_MANY;
						}
					} else if (relatedObject) {
						fieldObject.relationshipType = RelationshipType.MANY_TO_ONE;
					}

					fieldObject.filter = field.adminUIOptions?.hideInFilterBar
						? undefined
						: { type: mapFilterType(fieldObject) };

					return fieldObject;
				});

				const summaryField = entity.adminUIOptions?.summaryField ?? defaultSummaryField;

				return {
					name,
					plural,
					backendId,
					summaryField,
					fields,
					attributes,
					defaultFilter: adminUIOptions?.defaultFilter,
				};
			})
			.filter((entity) => entity && !!entity.backendId);

		const enums = Array.from(graphweaverMetadata.enums()).map((registeredEnum) => ({
			name: registeredEnum.name,
			values: Object.entries(registeredEnum.target).map(([name, value]) => ({
				name,
				value,
			})),
		}));

		if (hooks?.afterRead) {
			const result = await hooks.afterRead({ context, metadata: { entities, enums } });
			return result.metadata;
		}

		return { entities, enums };
	};
};

// export const getAdminUiMetadataResolver = (hooks?: AdminMetadata['hooks']) => {
// 	@Resolver((of) => AdminUiMetadata)
// 	class AdminUiMetadataResolver {
// 		@Query(() => AdminUiMetadata, { name: '_graphweaver' })
// 		public async getAdminUiMetadata<C extends BaseContext>(@Ctx() context: C) {
// 			await hooks?.beforeRead?.({ context });

// 			const enumMetadata = new Map<object, EnumMetadata>();
// 			for (const registeredEnum of graphweaverMetadata.enums) {
// 				enumMetadata.set(registeredEnum.enumObj, registeredEnum);
// 			}

// 			const entities: (AdminUiEntityMetadata | undefined)[] = graphweaverMetadata.entities
// 				.map((entity) => {
// 					const name = entity.name;
// 					const adminUISettings = AdminUISettingsMap.get(name);
// 					const defaultFilter = adminUISettings?.entity?.defaultFilter;

// 					if (adminUISettings?.entity?.hideFromDisplay) {
// 						return;
// 					}

// 					const backendId = entity.provider?.backendId;
// 					const plural = entity.plural;

// 					const visibleFields = entity.fields.filter(
// 						(field) => !adminUISettings?.fields?.[field.name]?.hideFromDisplay
// 					);

// 					const summaryField = visibleFields.find((field) =>
// 						isSummaryField(entity.target, field.name)
// 					)?.name;

// 					const attributes = new AdminUiEntityAttributeMetadata();
// 					if (isReadOnlyAdminUI(entity.target)) {
// 						attributes.isReadOnly = true;
// 					}

// 					const exportPageSize = getExportPageSize(entity.target);
// 					if (exportPageSize) {
// 						attributes.exportPageSize = exportPageSize;
// 					}

// 					const fields = visibleFields?.map((field) => {
// 						const typeValue = field.getType() as { name: string };
// 						const typeName = typeValue.name ?? enumMetadata.get(typeValue)?.name;

// 						const relatedObject = graphweaverMetadata.hasEntity(typeName)
// 							? graphweaverMetadata.getEntity(typeName)
// 							: undefined;

// 						// Define field attributes
// 						const isReadOnly = isReadOnlyPropertyAdminUI(entity.target, field.name);
// 						const isRequired = !field.typeOptions.nullable;

// 						const fieldObject: AdminUiFieldMetadata = {
// 							name: field.name,
// 							type: relatedObject?.name || typeName,
// 							isArray: field.typeOptions.array,
// 							extensions: field.extensions || {},
// 							attributes: {
// 								isReadOnly,
// 								isRequired,
// 							},
// 						};

// 						// Check if we have an array of related entities
// 						if (field.typeOptions.array && relatedObject) {
// 							// Ok, it's a relationship to another object type that is an array, e.g. "to many".
// 							// We'll default to one to many, then if we can find a field on the other side that points
// 							// back to us and it's also an array, then it's a many to many.
// 							fieldObject.relatedEntity = relatedObject.name;
// 							fieldObject.relationshipType = RelationshipType.ONE_TO_MANY;

// 							const relatedEntityField = relatedObject.fields.find((field) => {
// 								const fieldType = field.getType() as { name?: string };
// 								return fieldType.name === entity.target.name;
// 							});
// 							if (relatedEntityField?.typeOptions.array) {
// 								fieldObject.relationshipType = RelationshipType.MANY_TO_MANY;
// 							}
// 						} else if (relatedObject) {
// 							fieldObject.relationshipType = RelationshipType.MANY_TO_ONE;
// 						}
// 						fieldObject.filter = adminUISettings?.fields?.[field.name]?.hideFromFilterBar
// 							? undefined
// 							: {
// 									type: mapFilterType(fieldObject),
// 								};

// 						return fieldObject;
// 					});
// 					return {
// 						name,
// 						plural,
// 						defaultFilter,
// 						backendId,
// 						summaryField,
// 						fields,
// 						attributes,
// 					};
// 				})
// 				.filter((entity) => entity && !!entity.backendId);

// 			const enums = graphweaverMetadata.enums.map((registeredEnum) => ({
// 				name: registeredEnum.name,
// 				values: Object.entries(registeredEnum.enumObj).map(([name, value]) => ({
// 					name,
// 					value,
// 				})),
// 			}));

// 			const params = hooks?.afterRead
// 				? await hooks.afterRead({ context, metadata: { entities, enums } })
// 				: {
// 						metadata: { entities, enums },
// 					};

// 			return params?.metadata;
// 		}
// 	}

// 	return AdminUiMetadataResolver;
// };
