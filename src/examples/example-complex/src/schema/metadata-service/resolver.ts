import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { ReferenceType } from '@exogee/graphweaver-mikroorm';
import { getMetadataStorage, Query, Resolver } from 'type-graphql';
import { AdminField } from './admin-field';
import { AdminUiMetadata } from './entity';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import { GraphQLScalarType } from 'graphql';

@Resolver((of) => AdminUiMetadata)
@AuthorizedBaseFunctions()
export class AdminUiMetadataResolver {
	@Query(() => [AdminUiMetadata], { name: '_graphweaver' })
	public async getAdminUiMetadata() {
		const metadata = getMetadataStorage();
		const objectTypeData: { [entityName: string]: ObjectClassMetadata } = {};
		for (const objectType of metadata.objectTypes) {
			objectTypeData[objectType.name] = objectType;
		}
		const objectTypes = metadata.objectTypes.map((objectType) => {
			const fields = objectType.fields.map((field) => {
				const typeValue = field.getType() as any;
				const entityName = typeValue.name;
				const fieldObject: AdminField = {
					name: field.name,
					type: entityName,
					relationshipType: null,
					relatedEntity: null,
				};
				const relatedObject = objectTypeData[entityName];
				if (field.typeOptions.array) {
					if (!relatedObject) {
						throw new Error(`unknown entityName ${entityName}`);
					}
					const relatedEntity = relatedObject.fields.find((field) => {
						const fieldType = field.getType() as any;
						return fieldType.name === objectType.name;
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
				name: objectType.name,
				backendId: '', // @todo
				fields: fields,
			};
		});
		return objectTypes;
	}
}
