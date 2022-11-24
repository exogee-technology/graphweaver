import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { ReferenceType } from '@exogee/graphweaver-mikroorm';
import { getMetadataStorage, Query, Resolver } from 'type-graphql';
import { AdminField, AdminUiMetadata } from './entity';

@Resolver((of) => AdminUiMetadata)
// @AuthorizedBaseFunctions()
export class AdminUiMetadataResolver {
	getObjectFromName(name: string, objectTypes: any[]) {
		const objectType = objectTypes.find((objectType) => objectType.name === name);
		return objectType;
	}

	getFieldType(name: string, fields: any[]) {
		const field = fields.find((field) => field.name === name);
		return field;
	}

	@Query(() => [AdminUiMetadata], { name: '_graphweaver' })
	public async getAdminUiMetadata() {
		const metadata = getMetadataStorage();
		const objectTypes = metadata.objectTypes.map((objectType) => {
			const fields = objectType.fields.map((field) => {
				const typeValue = field.getType();
				const entityName = typeValue.name;
				const fieldObject: AdminField = {
					name: field.name,
					type: entityName,
				};
				const relatedObject = this.getObjectFromName(entityName, metadata.objectTypes);
				if (field.typeOptions.array) {
					const relatedObject = this.getObjectFromName(entityName, metadata.objectTypes);
					if (relatedObject) {
						const relatedEntity = relatedObject.fields.find((field) => {
							const fieldTypeName = field.getType().name;
							return fieldTypeName === objectType.name;
						});
						if (relatedEntity?.typeOptions) {
							fieldObject.relationshipType = relatedEntity.typeOptions.array
								? ReferenceType.MANY_TO_MANY
								: ReferenceType.ONE_TO_MANY;
						}
					} else {
						throw new Error(`unknown entityName ${entityName}`);
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
		console.log('objectTypes ==== ', objectTypes);
		return objectTypes;
	}
}
