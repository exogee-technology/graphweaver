import {
	AuthorizedBaseFunctions,
	EntityMetadataMap,
	isSummaryField,
	AdminUISettingsMap,
	AdminUIFilterType,
} from '@exogee/graphweaver';
import { ReferenceType } from '@exogee/graphweaver-mikroorm';
import { getMetadataStorage, Query, Resolver } from 'type-graphql';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import { EnumMetadata } from 'type-graphql/dist/metadata/definitions';
import { AdminUiMetadata } from './metadata';
import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';

const mapFilterType = (field: AdminUiFieldMetadata, enums: EnumMetadata[]): AdminUIFilterType => {
	// Check if we have a relationship
	if (field.relationshipType) {
		return AdminUIFilterType.RELATIONSHIP;
	}

	// Check if we have an enum
	const isEnum = enums.find((value) => value.name === field.type);
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
		default:
			return AdminUIFilterType.TEXT;
	}
};

@Resolver((of) => AdminUiMetadata)
@AuthorizedBaseFunctions()
export class AdminUiMetadataResolver {
	@Query(() => AdminUiMetadata, { name: '_graphweaver' })
	public async getAdminUiMetadata() {
		const metadata = getMetadataStorage();

		// Build some lookups for more efficient data locating later.
		const objectTypeData: { [entityName: string]: ObjectClassMetadata } = {};
		for (const objectType of metadata.objectTypes) {
			objectTypeData[objectType.name] = objectType;
		}

		const enumMetadata = new Map<object, EnumMetadata>();
		for (const registeredEnum of metadata.enums) {
			enumMetadata.set(registeredEnum.enumObj, registeredEnum);
		}

		const entities: AdminUiEntityMetadata[] = metadata.objectTypes
			.map((objectType) => {
				const name = objectType.name;
				const adminUISettings = AdminUISettingsMap.get(name);
				const backendId = EntityMetadataMap.get(name)?.provider?.backendId ?? null;
				const summaryField = objectType.fields?.find((field) =>
					isSummaryField(objectType.target, field.name)
				)?.name;
				const fields = objectType.fields?.map((field) => {
					const typeValue = field.getType() as any;
					const entityName = typeValue.name ? typeValue.name : enumMetadata.get(typeValue)?.name;
					const fieldObject: AdminUiFieldMetadata = {
						name: field.name,
						type: entityName,
					};
					const relatedObject = objectTypeData[entityName];
					if (field.typeOptions.array) {
						if (!relatedObject) {
							throw new Error(`Unknown entityName ${entityName}`);
						}
						const relatedEntity = relatedObject.fields?.find((field) => {
							const fieldType = field.getType() as any;
							return fieldType.name === name;
						});
						if (relatedEntity?.typeOptions) {
							fieldObject.relationshipType = relatedEntity.typeOptions.array
								? ReferenceType.MANY_TO_MANY
								: ReferenceType.ONE_TO_MANY;
						}
						fieldObject.relatedEntity = entityName;
					} else if (relatedObject) {
						fieldObject.relationshipType = ReferenceType.MANY_TO_ONE;
					}
					fieldObject.filter = adminUISettings?.fields?.[field.name]?.filter?.hide
						? undefined
						: {
								type: mapFilterType(fieldObject, metadata.enums),
						  };
					return fieldObject;
				});
				return {
					name,
					backendId,
					summaryField,
					fields,
				};
			})
			.filter((entity) => !!entity.backendId);

		const enums = metadata.enums.map((registeredEnum) => ({
			name: registeredEnum.name,
			values: Object.entries(registeredEnum.enumObj).map(([name, value]) => ({
				name,
				value,
			})),
		}));

		return {
			entities,
			enums,
		};
	}
}
