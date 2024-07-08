import { EntityMetadata, graphweaverMetadata } from '../metadata';

export const hasId = <G = unknown, D = unknown>(
	entityMetdata: EntityMetadata<G, D>,
	value: Partial<G>
) => {
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetdata);
	const typeOfPrimaryKeyValue = typeof value[primaryKeyField as keyof G];

	return typeOfPrimaryKeyValue === 'string' || typeOfPrimaryKeyValue === 'number';
};
