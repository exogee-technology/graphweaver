import { BaseDataEntity, EntityMetadata, graphweaverMetadata } from '..';

export const hasId = <G, D extends BaseDataEntity>(
	entityMetdata: EntityMetadata<G, D>,
	value: Partial<G>
) => {
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetdata);
	const typeOfPrimaryKeyValue = typeof value[primaryKeyField as keyof typeof value];

	return typeOfPrimaryKeyValue === 'string' || typeOfPrimaryKeyValue === 'number';
};
