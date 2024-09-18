import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';
import { graphweaverMetadata } from '../metadata';
import { AdminUIFilterType, BaseContext, RelationshipType, ResolverOptions } from '../types';
import { getFieldTypeWithMetadata } from '../schema-builder';
import { hookManagerMap, HookRegister } from '../hook-manager';

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

/**
 * @deprecated This argument should not be used and will be removed in the future. Use `applyAccessControlList` instead.
 */
type Hooks = {
	beforeRead?: <C extends BaseContext>(
		params: MetadataHookParams<C>
	) => Promise<MetadataHookParams<C>>;
	afterRead?: <C extends BaseContext>(
		params: MetadataHookParams<C>
	) => Promise<MetadataHookParams<C>>;
};

export const resolveAdminUiMetadata = (hooks?: Hooks) => {
	return async <C extends BaseContext>({ context, fields }: ResolverOptions<unknown, C>) => {
		// @deprecated the line below can be removed once the hook is
		await hooks?.beforeRead?.({ context });

		const hookManager = hookManagerMap.get('AdminUiMetadata');

		if (hookManager)
			await hookManager.runHooks(HookRegister.BEFORE_READ, {
				context,
				transactional: false,
				fields,
			});

		const entities: (AdminUiEntityMetadata | undefined)[] = Array.from(
			graphweaverMetadata.entities()
		).map((entity) => {
			const { adminUIOptions, apiOptions, provider } = entity;
			const backendId = entity.provider?.backendId;
			const backendDisplayName = entity.provider?.backendDisplayName;
			const plural = entity.plural;

			const attributes = new AdminUiEntityAttributeMetadata();
			attributes.exportPageSize = entity.adminUIOptions?.exportPageSize;
			attributes.clientGeneratedPrimaryKeys = entity.apiOptions?.clientGeneratedPrimaryKeys;
			attributes.isReadOnly =
				entity.adminUIOptions?.readonly ??
				entity.apiOptions?.excludeFromBuiltInOperations ??
				entity.apiOptions?.excludeFromBuiltInWriteOperations ??
				false;

			let defaultSummaryField: 'name' | 'title' | undefined = undefined;
			const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity);
			let defaultFieldForDetailPanel = primaryKeyField;

			const fields = Object.values(entity.fields)?.map((field) => {
				const {
					fieldType,
					isList,
					metadata: relatedObject,
				} = getFieldTypeWithMetadata(field.getType);
				const typeName = (fieldType as any).name;

				// set the default summary field
				if (['name', 'title'].includes(field.name))
					defaultSummaryField = field.name as 'name' | 'title';

				// Check if the field is set as the field for the detail panel
				if (field.adminUIOptions?.fieldForDetailPanelNavigationId) {
					defaultFieldForDetailPanel = field.name;
				}

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
					hideInTable: field.adminUIOptions?.hideInTable,
					hideInFilterBar: field.adminUIOptions?.hideInFilterBar,
					hideInDetailForm: field.adminUIOptions?.hideInDetailForm,
				};

				// Check if we have an array of related entities
				if (isList && relatedObject?.type === 'entity') {
					// Ok, it's a relationship to another object type that is an array, e.g. "to many".
					// We'll default to one to many, then if we can find a field on the other side that points
					// back to us and it's also an array, then it's a many to many.
					fieldObject.relatedEntity = graphweaverMetadata.federationNameForEntity(relatedObject);
					fieldObject.relationshipType = RelationshipType.ONE_TO_MANY;

					const relatedEntityField = Object.values(relatedObject.fields).find((field) => {
						const fieldType = field.getType() as { name?: string };
						return fieldType.name === (entity.target as { name?: string }).name;
					});
					if (Array.isArray(relatedEntityField?.getType())) {
						fieldObject.relationshipType = RelationshipType.MANY_TO_MANY;
					}
				} else if (relatedObject && relatedObject?.type === 'entity') {
					fieldObject.relatedEntity = graphweaverMetadata.federationNameForEntity(relatedObject);
					fieldObject.relationshipType = RelationshipType.MANY_TO_ONE;
				}

				fieldObject.filter = { type: mapFilterType(fieldObject) };

				return fieldObject;
			});

			const summaryField = entity.adminUIOptions?.summaryField ?? defaultSummaryField;
			const fieldForDetailPanelNavigationId =
				entity.adminUIOptions?.fieldForDetailPanelNavigationId ?? defaultFieldForDetailPanel;

			return {
				name: graphweaverMetadata.federationNameForEntity(entity),
				plural,
				backendId,
				backendDisplayName,
				primaryKeyField,
				summaryField,
				fieldForDetailPanelNavigationId,
				fields,
				attributes,
				excludeFromTracing: apiOptions?.excludeFromTracing ?? false,
				hideInSideBar: adminUIOptions?.hideInSideBar ?? false,
				defaultFilter: adminUIOptions?.defaultFilter,
				defaultSort: adminUIOptions?.defaultSort,
				supportedAggregationTypes: [
					...(provider?.backendProviderConfig?.supportedAggregationTypes ?? new Set()),
				],
			};
		});

		const enums = Array.from(graphweaverMetadata.enums()).map((registeredEnum) => ({
			name: registeredEnum.name,
			values: Object.entries(registeredEnum.target).map(([name]) => ({
				name,

				// While it seems odd to return the name twice here, that's actually what the client should use as the value
				// for the enum. In the backend we have something like enum UserStatus { ACTIVE = 'active' }. When this comes out
				// in the GraphQL schema it'll be referred to as 'ACTIVE' in that schema, so the client should always use the key
				// for the value to send to the backend. This is intentional.
				value: name,
			})),
		}));

		if (hookManager) {
			const result = await hookManager.runHooks(HookRegister.AFTER_READ, {
				context,
				transactional: false,
				fields,
				entities,
			});
			return {
				entities: result.entities,
				enums: enums,
			};
		}

		// @deprecated this section of code can be removed once the hook argument is removed
		if (hooks?.afterRead) {
			const result = await hooks.afterRead({ context, metadata: { entities, enums } });
			return result.metadata;
		}

		return {
			entities,
			enums,
		};
	};
};
