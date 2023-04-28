import {
	BaseDataEntity,
	BaseResolverMetadataEntry,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphqlEntityType,
	WithId,
} from '..';

// Checks if we have an object
const isObject = (node: any) => typeof node === 'object' && node !== null;

export const createOrUpdateEntities = <G extends WithId, D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<G, D>
) => {
	// Covert the data entity from the backend to the GraphQL entity
	const fromBackendEntity = (dataEntity: D) => {
		if (!gqlEntityType.fromBackendEntity) {
			throw new Error(
				`Implementation Error: No fromBackendEntity method supplied for ${gqlEntityType.name}`
			);
		}
		const entity = gqlEntityType.fromBackendEntity.call(gqlEntityType, dataEntity);
		if (entity === null) {
			throw new Error(
				`Implementation Error: fromBackendEntity returned null for ${gqlEntityType.name}`
			);
		}
		return entity;
	};

	// Get the meta data for this entity and error check
	const getMeta = (name: string) => {
		const meta = EntityMetadataMap.get(name);
		if (!meta) {
			throw new Error(`Unexpected Error: entity not found in metadata map`);
		}
		return meta;
	};

	const createOrUpdateEntity = async (
		operation: Promise<any>,
		meta: BaseResolverMetadataEntry<any>
	) => {
		// We have an object like {name: "test"} so we need to perform a create
		const result = (await operation) as D;
		const entity = fromBackendEntity(result);

		// Let's check if this was the original root entity, if it is we can return the whole object
		if (meta.entity.name === gqlEntityType.name) {
			return entity;
		}
		// Otherwise we can return the id to attach to the parent entity
		return { id: entity.id } as Partial<G>;
	};

	const traverseInput = async <T>(
		input: Partial<G> | Partial<G>[],
		meta: BaseResolverMetadataEntry<any>
	) => {
		if (Array.isArray(input)) {
			// Here we have an array nothing to do but loop through them
			const nodes: Partial<G>[] = [];
			for (const node of input) {
				const updatedNode = await traverseInput(node, meta);
				if (Array.isArray(updatedNode)) {
					throw new Error('We should not have an array inside an array');
				}
				nodes.push(updatedNode);
			}
			return nodes;
		} else if (isObject(input)) {
			// Here we have an object so now we need to find any related entities and see if we need to update or create them

			let node = { ...input };
			// Lets loop through the properties and check for nested entities
			for (const entry of Object.entries(input)) {
				const [key, childNode] = entry as any;

				const relationship = meta.fields.find((field) => field.name === key);
				const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<BaseDataEntity>;
				const isRelatedEntity = relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;

				if (isRelatedEntity) {
					// We have a related entity so lets traverse and check if we need to do an update or create
					node = {
						...node,
						[key]: await traverseInput(childNode, getMeta(relatedEntity.name)),
					};
				}
			}

			// Down here we have an entity and let's check if we need to create or update
			if ('id' in node && node.id && Object.keys(node).length === 1) {
				// Nothing to do here we are just attaching the id
				return node;
			} else if ('id' in node && node.id && Object.keys(node).length > 1) {
				// We have an object like this {id: 1, name: "test"} so we need to update the name property
				const operation = meta.provider.updateOne(node.id, node);
				return createOrUpdateEntity(operation, meta);
			} else {
				// We have an object like {name: "test"} so we need to perform a create
				const operation = meta.provider.createOne(node);
				return createOrUpdateEntity(operation, meta);
			}
		}

		throw new Error(`Unexpected Error: trying to create entity ${gqlEntityType.name}`);
	};
	return traverseInput;
};
