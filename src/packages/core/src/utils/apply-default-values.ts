import { EntityMetadata, graphweaverMetadata, isEntityMetadata } from '../metadata';

export const applyDefaultValues = <G = unknown, D = unknown>(
	data: Partial<G> | Partial<G>[],
	entityMetadata: EntityMetadata<G, D>
) => {
	const dataArray = Array.isArray(data) ? data : [data];
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetadata);

	for (const item of dataArray) {
		// If the item has an ID, then it is an update, and we should not apply default values.
		// This function is called from createOrUpdate mutations, so we don't want to be applying defaults
		// on updates where users are trying to set just one value.
		if ((item as any)[primaryKeyField] !== undefined) continue;

		for (const field of Object.values(entityMetadata.fields)) {
			const currentValue = item[field.name as keyof G];
			if (
				currentValue !== undefined &&
				currentValue !== null &&
				(field.relationshipInfo?.id || field.relationshipInfo?.relatedField)
			) {
				// It's a relationship. We need to recurse.
				const relatedEntity = graphweaverMetadata.metadataForType(field.getType());

				if (!isEntityMetadata<any, any>(relatedEntity)) {
					throw new Error(`No entity metadata found for ${String(field.getType())}`);
				}

				applyDefaultValues(currentValue, relatedEntity);
			} else if (field.defaultValue !== undefined && currentValue === undefined) {
				item[field.name as keyof G] = field.defaultValue;
			}
		}
	}
};
