import { GraphQLList, GraphQLResolveInfo } from 'graphql';

import {
	BaseContext,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	EntityMetadata,
	GraphQLEntity,
	GraphQLEntityType,
	HookRegister,
	getFieldTypeFromFieldMetadata,
	graphQLTypeForEntity,
	hookManagerMap,
} from '..';
import { graphweaverMetadata } from '../metadata';
import { createOrUpdate } from '../resolvers';

// Checks if we have an object
const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

// Used to check if we have only {id: ''} or [{id: ''},...]
const isLinking = <G>(entity: EntityMetadata<G, any>, node: Partial<G> | Partial<G>[]) =>
	Array.isArray(node)
		? node.every((innerNode) => isIdOnly(entity, innerNode))
		: isIdOnly(entity, node);

const isSerializable = (
	entity: typeof GraphQLEntity
): entity is typeof GraphQLEntity & {
	serialize: <T>(value: unknown) => T;
} => entity && entity.hasOwnProperty('serialize');

// Used to check if we have only {id: ''} object
const isIdOnly = <G>(entity: EntityMetadata<G, any>, node: Partial<G>) => {
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof G;

	return primaryKeyField in node && node[primaryKeyField] && Object.keys(node).length === 1;
};

export const isRelatedEntity = (unknownType: unknown): unknownType is typeof GraphQLEntity => {
	return !!(
		unknownType &&
		typeof unknownType === 'function' &&
		'prototype' in unknownType &&
		unknownType.prototype instanceof GraphQLEntity
	);
};

const runChildCreateOrUpdate = <G extends { name: string }>(
	entityMetadata: EntityMetadata<any, any>,
	data: Partial<G> | Partial<G>[],
	context: BaseContext
): Promise<G | G[]> => {
	const graphQLType = graphQLTypeForEntity(entityMetadata);

	// This is a fake GraphQL Resolve Info we pass to ourselves so the resolver will return the correct
	// result type. The only thing we read in it is the return type, so we'll just stub that.
	const infoFacade: Partial<GraphQLResolveInfo> = {
		returnType: Array.isArray(data) ? new GraphQLList(graphQLType) : graphQLType,
	};

	return createOrUpdate(undefined, { input: data }, context, infoFacade as GraphQLResolveInfo);
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

export const createOrUpdateEntities = async <G extends { name: string }, D extends BaseDataEntity>(
	input: Partial<G> | Partial<G>[],
	meta: EntityMetadata<G, D>,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	const gqlEntityType: GraphQLEntityType<G, D> = meta.target;

	if (!meta.provider) {
		throw new Error(`No provider found for ${meta.name}, cannot create or update entities`);
	}

	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;

	if (Array.isArray(input)) {
		// If input is an array, loop through the elements
		const nodes: Partial<G>[] = [];
		for (const node of input) {
			const updatedNode = await createOrUpdateEntities(node, meta, info, context);
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
			const relationship = meta.fields[key];
			const { fieldType } = getFieldTypeFromFieldMetadata(relationship);

			if (isRelatedEntity(fieldType)) {
				const relatedEntityMetadata = graphweaverMetadata.metadataForType(
					fieldType
				) as EntityMetadata<any, any>;

				if (isSerializable(fieldType)) {
					// If it's a serializable entity, we should delegate the serialization to it.
					node[key as keyof typeof node] = fieldType.serialize({ value: childNode }) as
						| G[keyof G]
						| undefined;
				} else if (isLinking(relatedEntityMetadata, childNode)) {
					// If it's a linking entity or an array of linking entities, nothing to do here
				} else if (Array.isArray(childNode)) {
					// If we have an array, we may need to create the parent first as children need reference to the parent
					// As are updating the parent from the child, we can remove this key
					delete node[key as keyof Partial<G>];

					const relatedPrimaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(
						relatedEntityMetadata
					) as keyof G;

					// Check if we already have the parent ID
					let parentId = node[relatedPrimaryKeyField] ?? parent?.[primaryKeyField];
					if (!parentId && !parent) {
						// If there's no ID, create the parent first
						const parentDataEntity = await meta.provider.createOne(node);
						parent = fromBackendEntity(parentDataEntity, gqlEntityType);
						parentId = parent?.[primaryKeyField];
					}
					if (!parentId) {
						throw new Error(`Implementation Error: No parent id found for ${fieldType.name}`);
					}

					// Add parent ID to children and perform the mutation
					const childMeta = graphweaverMetadata.getEntityByName(fieldType.name);
					if (!childMeta)
						throw new Error(`Could not locate metadata for '${fieldType.name}' entity.`);

					// @todo: What if there are mutiple fields on the child that reference the same type? Don't we want a specific one?
					const parentField = Object.values(childMeta.fields).find((field) => {
						const { fieldType: type } = getFieldTypeFromFieldMetadata(field);
						return type === gqlEntityType;
					});
					if (!parentField) {
						throw new Error(`Implementation Error: No parent field found for ${fieldType.name}`);
					}
					const childEntities = childNode.map((child) => ({
						...child,
						[parentField.name]: { [primaryKeyField]: parentId },
					}));

					// Now create/update the children
					await runChildCreateOrUpdate(childMeta, childEntities, context);
				} else if (Object.keys(childNode).length > 0) {
					const childMeta = graphweaverMetadata.getEntityByName(fieldType.name);
					if (!childMeta)
						throw new Error(`Could not locate metadata for '${fieldType.name}' entity.`);

					// If only one object, create or update it first, then update the parent reference
					const result = await runChildCreateOrUpdate(childMeta, childNode, context);

					node = {
						...node,
						[key]: result,
					};
				}
			}
		}

		// Down here we have an entity and need to check if we need to create or update
		if (parent) {
			// We needed to create the parent earlier, no need to create it again
			return parent;
		} else if (isIdOnly(meta, node)) {
			// If it's just an ID, return it as is
			return node;
		} else if (primaryKeyField in node && node[primaryKeyField] && Object.keys(node).length > 1) {
			// If it's an object with an ID and other properties, update the entity
			const result = await meta.provider.updateOne(String(node[primaryKeyField]), node);
			return fromBackendEntity(result, gqlEntityType);
		} else {
			// If it's an object without an ID, create a new entity
			const result = await meta.provider.createOne(node);
			return fromBackendEntity(result, gqlEntityType);
		}
	}

	throw new Error(`Unexpected Error: trying to create entity ${meta.name}`);
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
