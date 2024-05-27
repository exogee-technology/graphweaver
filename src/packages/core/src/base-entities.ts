import { Source } from 'graphql';
import { EntityMetadata, FieldMetadata, Filter } from '.';

// These are static methods you can implement on the entity class itself to nest objects.
export interface SerializableGraphQLEntityClass<G = unknown, D = unknown> {
	serialize: (options: { value: G }) => D;
	deserialize: (options: {
		value: unknown;
		parent: Source;
		fieldMetadata: FieldMetadata<G, D>;
		entityMetadata: EntityMetadata<G, D>;
	}) => G;
}

export const isSerializableGraphQLEntityClass = <G>(
	entity: unknown
): entity is SerializableGraphQLEntityClass<G> => {
	const test = entity as SerializableGraphQLEntityClass<G> | undefined;
	return typeof test?.serialize === 'function' && typeof test?.deserialize === 'function';
};

export interface TransformableGraphQLEntityClass<G = unknown, D = unknown> {
	fromBackendEntity(this: new (dataEntity: D) => G, dataEntity: D): G;
	toBackendEntity(this: new (dataEntity: D) => G, graphqlEntity: Partial<G>): D;
	toBackendEntityFilter(this: new (dataEntity: D) => G, graphqlFilter: Filter<G>): Filter<D>;
}

export function isTransformableGraphQLEntityClass<G = unknown, D = unknown>(
	value: unknown
): value is TransformableGraphQLEntityClass<G, D> {
	const test = value as TransformableGraphQLEntityClass<G, D>;

	return (
		typeof test?.fromBackendEntity === 'function' &&
		typeof test?.toBackendEntity === 'function' &&
		typeof test?.toBackendEntityFilter === 'function'
	);
}
