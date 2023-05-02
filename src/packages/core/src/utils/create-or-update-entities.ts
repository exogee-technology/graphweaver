import { GraphQLResolveInfo, OperationTypeNode } from 'graphql';
import { delegateToSchema } from '@graphql-tools/delegate';
import pluralize from 'pluralize';

import {
	BaseContext,
	BaseDataEntity,
	EntityMetadataMap,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphqlEntityType,
	WithId,
} from '..';

// Checks if we have an object
const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

// Used to check if we have only {id: ''} or [{id: ''},...]
const isLinking = <G>(node: Partial<G> | Partial<G>[]) =>
	Array.isArray(node) ? node.every(isIdOnly) : isIdOnly(node);

// Used to check if we have only {id: ''} object
const isIdOnly = <G>(node: Partial<G>) =>
	('id' in node && node.id && Object.keys(node).length === 1) ?? false;

// Get the meta data for this entity and error check
const getMeta = (name: string) => {
	const meta = EntityMetadataMap.get(name);
	if (!meta) {
		throw new Error(`Unexpected Error: entity not found in metadata map`);
	}
	return meta;
};

// Determine the name of the mutation that we should call
const getMutationName = <G extends WithId>(
	name: string,
	data: Partial<G> | Partial<G>[]
): string => {
	const plural = pluralize(name);
	if (Array.isArray(data)) {
		const isUpdateMany = data.every((object) => object.id);
		if (isUpdateMany) return `update${plural}`;
		const isCreateMany = data.every((object) => object.id === undefined);
		if (isCreateMany) return `create${plural}`;
		return `createOrUpdate${plural}`;
	}
	if (data.id) return `update${name}`;
	return `create${name}`;
};

// This function is used to call the child's base resolver create/update mutation
const callChildMutation = async <G>(
	mutationName: string,
	data: Partial<G>,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	const result = await delegateToSchema({
		schema: info.schema,
		operation: OperationTypeNode.MUTATION,
		fieldName: mutationName,
		args: { input: { data } },
		context,
		info,
	});
	if (result.name === 'GraphQLError') {
		throw new Error(result.message);
	}
	return result;
};

// Covert the data entity from the backend to the GraphQL entity
const fromBackendEntity = <G, D extends BaseDataEntity>(
	dataEntity: D,
	gqlEntityType: GraphqlEntityType<G, D>
) => {
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

export const createOrUpdateEntities = async <G extends WithId, D extends BaseDataEntity>(
	input: Partial<G> | Partial<G>[],
	entityTypeName: string,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	const meta = getMeta(entityTypeName);
	const gqlEntityType: GraphqlEntityType<G, D> = meta.entity.target;

	if (Array.isArray(input)) {
		// Here we have an array nothing to do but loop through them
		const nodes: Partial<G>[] = [];
		for (const node of input) {
			const updatedNode = await createOrUpdateEntities(node, entityTypeName, info, context);
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
			const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<
				GraphQLEntity<BaseDataEntity>,
				BaseDataEntity
			>;
			const isRelatedEntity = relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;

			if (isRelatedEntity) {
				// We have a related entity so lets check if we need to do an update or create
				const result = isLinking(childNode) // if all entities are in the format {id: ""} then we are just linking the entity
					? childNode
					: await callChildMutation(
							getMutationName(relatedEntity.name, childNode),
							childNode,
							info,
							context
					  );
				node = {
					...node,
					[key]: result,
				};
			}
		}

		// Down here we have an entity and let's check if we need to create or update
		if (isIdOnly(node)) {
			// Nothing to do here we are just attaching the id
			return node;
		} else if ('id' in node && node.id && Object.keys(node).length > 1) {
			// We have an object like this {id: 1, name: "test"} so we need to update the name property
			const result = await meta.provider.updateOne(node.id, node);
			return fromBackendEntity(result, gqlEntityType);
		} else {
			// We have an object like {name: "test"} so we need to perform a create
			const result = await meta.provider.createOne(node);
			return fromBackendEntity(result, gqlEntityType);
		}
	}

	throw new Error(`Unexpected Error: trying to create entity ${entityTypeName}`);
};
