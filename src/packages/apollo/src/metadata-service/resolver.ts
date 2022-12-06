import { AuthorizedBaseFunctions, EntityMetadataMap } from '@exogee/graphweaver';
import { ReferenceType } from '@exogee/graphweaver-mikroorm';
import { getMetadataStorage, Query, Resolver } from 'type-graphql';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import { EnumMetadata } from 'type-graphql/dist/metadata/definitions';
import { AdminUiMetadata } from './metadata';
import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityMetadata } from './entity';

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
				const backendId = EntityMetadataMap.get(name)?.provider?.backendId ?? null;
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
					return fieldObject;
				});
				return {
					name,
					backendId,
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
