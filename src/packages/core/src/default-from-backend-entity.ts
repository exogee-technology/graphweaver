import {
	EntityMetadata,
	graphweaverMetadata,
	isEntityMetadata,
	isTransformableGraphQLEntityClass,
} from '.';

const dataEntityPropertyKey = Symbol('dataEntity');

export interface WithDataEntity<D> {
	[dataEntityPropertyKey]: D;
}

export const dataEntityForGraphQLEntity = <G, D>(entity: G & WithDataEntity<D>): D =>
	entity[dataEntityPropertyKey];

// Covert the data entity from the backend to the GraphQL entity
export const fromBackendEntity = <G = unknown, D = unknown>(
	entityOrMetadata: EntityMetadata<G, D> | (new (...args: any[]) => G),
	dataEntity: D
) => {
	const entityMetadata = isEntityMetadata(entityOrMetadata)
		? entityOrMetadata
		: graphweaverMetadata.metadataForType(entityOrMetadata);

	if (!isEntityMetadata<G, D>(entityMetadata)) {
		throw new Error('Entity metadata not found for entity.');
	}

	// By default we just cast for performance, but if you want or need to override this behaviour so you can transform the fields
	// on the way through from D to G, no worries, implement fromBackendEntity on your entity class and we'll call it.
	let entity: G = dataEntity as unknown as G;

	if (
		isTransformableGraphQLEntityClass<G, D>(entityMetadata.target) &&
		entityMetadata.target.fromBackendEntity
	) {
		entity = entityMetadata.target.fromBackendEntity(dataEntity);
	} else if (
		entityMetadata.provider &&
		// We know that G and D have no overlap here from a type theory perspective, but they are sometimes the same class
		// and that is what we're checking for. This comparison is intentional.
		entityMetadata.target !== entityMetadata.provider.entityType
	) {
		// If they use two separate classes, one for the GQL entity and another for the backend entity,
		// but haven't implemented fromBackendEntity, we'll copy across for them.
		entity = defaultFromBackendEntity<G, D>(entityMetadata, dataEntity) as G;
	}

	// Always tag on the original data entity in a hidden way so that we can read it from
	// resolvers and access it later.
	(entity as WithDataEntity<D>)[dataEntityPropertyKey] = dataEntity;

	return entity;
};

const defaultFromBackendEntity = <G, D>(entityMetadata: EntityMetadata<G, D>, dataEntity: D) => {
	if (dataEntity === undefined || dataEntity === null) return null;

	// We pass the data entity as the only argument to the constructor in case consumers want to do
	// something with the data on the way in.
	const entity = new entityMetadata.target(dataEntity);

	// This is a for instead of a for-of for performance.
	const fields = Object.values(entityMetadata.fields);
	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		const fieldTypeMetadata = graphweaverMetadata.metadataForType(field.getType());

		// We don't want to copy relationships.
		if (!isEntityMetadata(fieldTypeMetadata)) {
			const dataField = dataEntity?.[fields[i].name as keyof D];

			if (typeof dataField !== 'undefined' && typeof entity[field.name as keyof G] !== 'function') {
				entity[field.name as keyof G] = dataField as any;
			}
		}
	}

	return entity;
};
