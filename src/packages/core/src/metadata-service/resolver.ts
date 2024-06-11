import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';

import {
	AdminUIFilterType,
	RelationshipType,
	BaseContext,
	graphweaverMetadata,
	getFieldTypeWithMetadata,
	ResolverOptions,
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
	return async <C extends BaseContext>({ context }: ResolverOptions<unknown, C>) => {
		await hooks?.beforeRead?.({ context });

		const entities: (AdminUiEntityMetadata | undefined)[] = Array.from(
			graphweaverMetadata.entities()
		)
			.map((entity) => {
				const { name, adminUIOptions, provider } = entity;

				// If the entity is hidden from the display, return undefined
				// so that it won't show up in the metadata.
				if (adminUIOptions?.hideInSideBar) return;

				const backendId = entity.provider?.backendId;
				const plural = entity.plural;

				const visibleFields = Object.values(entity.fields).filter(
					(field) => !field.adminUIOptions?.hideInTable
				);

				const attributes = new AdminUiEntityAttributeMetadata();
				attributes.exportPageSize = entity.adminUIOptions?.exportPageSize;
				attributes.isReadOnly = entity.adminUIOptions?.readonly;

				let defaultSummaryField: 'name' | 'title' | undefined = undefined;

				const fields = visibleFields?.map((field) => {
					const {
						fieldType,
						isList,
						metadata: relatedObject,
					} = getFieldTypeWithMetadata(field.getType);
					const typeName = (fieldType as any).name;

					// set the default summary field
					if (['name', 'title'].includes(field.name))
						defaultSummaryField = field.name as 'name' | 'title';

					// Define field attributes
					const isReadOnly = field.readonly ?? field.adminUIOptions?.readonly ?? false;
					const isRequired = !field.nullable;

					const fieldObject: AdminUiFieldMetadata = {
						name: field.name,
						type: relatedObject?.name || typeName,
						isArray: isList,
						attributes: {
							isReadOnly,
							isRequired,
						},
					};

					// Check if we have an array of related entities
					if (isList && relatedObject?.type === 'entity' && relatedObject.provider) {
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
					} else if (relatedObject && relatedObject?.type === 'entity' && relatedObject.provider) {
						fieldObject.relationshipType = RelationshipType.MANY_TO_ONE;
					}

					fieldObject.filter = field.adminUIOptions?.hideInFilterBar
						? undefined
						: { type: mapFilterType(fieldObject) };

					return fieldObject;
				});

				const summaryField = entity.adminUIOptions?.summaryField ?? defaultSummaryField;
				const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity);

				return {
					name,
					plural,
					backendId,
					primaryKeyField,
					summaryField,
					fields,
					attributes,
					defaultFilter: adminUIOptions?.defaultFilter,
					supportedAggregationTypes: [...(provider?.supportedAggregationTypes ?? new Set())],
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
