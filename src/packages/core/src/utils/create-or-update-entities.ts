import { GraphQLError, GraphQLResolveInfo, OperationTypeNode } from 'graphql';
import { delegateToSchema } from '@graphql-tools/delegate';

import {
	BaseContext,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLEntityType,
	HookRegister,
	WithId,
	hookManagerMap,
} from '..';
import { graphweaverMetadata } from '../metadata';

// Checks if we have an object
const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

// Used to check if we have only {id: ''} or [{id: ''},...]
const isLinking = <G>(node: Partial<G> | Partial<G>[]) =>
	Array.isArray(node) ? node.every(isIdOnly) : isIdOnly(node);

// Used to check if we have only {id: ''} object
const isIdOnly = <G>(node: Partial<G>) =>
	('id' in node && node.id && Object.keys(node).length === 1) ?? false;

// Determine the name of the mutation that we should call
const getMutationName = <G extends WithId>(
	name: string,
	data: Partial<G> | Partial<G>[]
): string => {
	const entityMetadata = graphweaverMetadata.getEntity(name);
	const plural = entityMetadata.plural;
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
export const callChildMutation = async <G>(
	mutationName: string,
	data: Partial<G>,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	const result = await delegateToSchema({
		schema: info.schema,
		operation: OperationTypeNode.MUTATION,
		fieldName: mutationName,
		args: Array.isArray(data) ? { input: { data } } : { data },
		context,
		info,
	});
	if (result.name === 'GraphQLError') {
		throw new GraphQLError(result.message, { ...result });
	}
	return result;
};

// Covert the data entity from the backend to the GraphQL entity
const fromBackendEntity = <G, D extends BaseDataEntity>(
	dataEntity: D,
	gqlEntityType: GraphQLEntityType<G, D>
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

export const createOrUpdateEntities = async <
	G extends WithId & { name: string },
	D extends BaseDataEntity,
>(
	input: Partial<G> | Partial<G>[],
	entityTypeName: string,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	const meta = graphweaverMetadata.getEntity<G, D>(entityTypeName);
	const gqlEntityType: GraphQLEntityType<G, D> = meta.target;

	if (!meta.provider) {
		throw new Error(`No provider found for ${entityTypeName}, cannot create or update entities`);
	}

	if (Array.isArray(input)) {
		// If input is an array, loop through the elements
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
		// If input is an object, check for nested entities and update/create them
		let node = { ...input };
		let parent: G | undefined = undefined;

		// Loop through the properties and check for nested entities
		for (const entry of Object.entries(input)) {
			const [key, childNode]: [string, Partial<G> | Partial<G>[]] = entry;

			// Check if the property represents a related entity
			const relationship = meta.fields.find((field) => field.name === key);
			const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<
				GraphQLEntity<BaseDataEntity>,
				BaseDataEntity
			>;
			const isRelatedEntity = relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;

			if (isRelatedEntity) {
				if (isLinking(childNode)) {
					// If it's a linking entity or an array of linking entities, nothing to do here
				} else if (Array.isArray(childNode)) {
					// If we have an array, we may need to create the parent first as children need reference to the parent

					// As are updating the parent from the child, we can remove this key
					delete node[key as keyof Partial<G>];

					// Check if we already have the parent ID
					let parentId = node.id ?? parent?.id;
					if (!parentId && !parent) {
						// If there's no ID, create the parent first
						const parentDataEntity = await meta.provider.createOne(node);
						parent = fromBackendEntity(parentDataEntity, gqlEntityType);
						parentId = parent?.id;
					}
					if (!parentId) {
						throw new Error(`Implementation Error: No parent id found for ${relatedEntity.name}`);
					}

					// Add parent ID to children and perform the mutation
					const childMeta = graphweaverMetadata.getEntity(relatedEntity.name);
					const parentField = childMeta.fields.find((field) => field?.getType() === gqlEntityType);
					if (!parentField) {
						throw new Error(
							`Implementation Error: No parent field found for ${relatedEntity.name}`
						);
					}
					const childEntities = childNode.map((child) => ({
						...child,
						[parentField.name]: { id: parentId },
					}));

					// Now create/update the children
					const mutationName = getMutationName(relatedEntity.name, childEntities);
					await callChildMutation(mutationName, childEntities, info, context);
					// on the next line lets make sure we have an object with at least 1 key
				} else if (Object.keys(childNode).length > 0) {
					// If only one object, create or update it first, then update the parent reference
					const mutationName = getMutationName(relatedEntity.name, childNode);
					const result = await callChildMutation(mutationName, childNode, info, context);

					node = {
						...node,
						[key]: result,
					};
				}
			}
		}

		// Down here we have an entity and let's check if we need to create or update
		if (parent) {
			// We needed to create the parent earlier, no need to create it again
			return parent;
		} else if (isIdOnly(node)) {
			// If it's just an ID, return it as is
			return node;
		} else if ('id' in node && node.id && Object.keys(node).length > 1) {
			// If it's an object with an ID and other properties, update the entity
			const result = await meta.provider.updateOne(node.id, node);
			return fromBackendEntity(result, gqlEntityType);
		} else {
			// If it's an object without an ID, create a new entity
			const result = await meta.provider.createOne(node);
			return fromBackendEntity(result, gqlEntityType);
		}
	}

	throw new Error(`Unexpected Error: trying to create entity ${entityTypeName}`);
};

export const runWritableBeforeHooks = async <G>(
	hookRegister: HookRegister,
	params: CreateOrUpdateHookParams<G>,
	gqlEntityTypeName: string
): Promise<CreateOrUpdateHookParams<G>> => {
	const hookManager = hookManagerMap.get(gqlEntityTypeName);
	const hookParams = hookManager ? await hookManager.runHooks(hookRegister, params) : params;

	const items = hookParams.args?.items;
	if (!items) throw new Error('No data specified cannot continue.');
	return params;
};
