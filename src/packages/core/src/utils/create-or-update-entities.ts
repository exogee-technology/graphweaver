import { GraphQLList, GraphQLResolveInfo, Source } from 'graphql';

import { EntityMetadata, graphweaverMetadata, isEntityMetadata } from '../metadata';
import { createOrUpdate } from '../resolvers';
import { fromBackendEntity } from '../default-from-backend-entity';
import { BaseContext, CreateOrUpdateHookParams, Filter, ResolveTree } from '../types';
import { getFieldTypeWithMetadata, graphQLTypeForEntity } from '../schema-builder';
import { HookRegister, hookManagerMap } from '../hook-manager';
import {
	isSerializableGraphQLEntityClass,
	isTransformableGraphQLEntityClass,
} from '../base-entities';

// Checks if we have an object
const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

// Used to check if we have only {id: ''} or [{id: ''},...]
const isLinking = <G = unknown, D = unknown>(
	entity: EntityMetadata<G, D>,
	node: Partial<G> | Partial<G>[]
) => {
	return Array.isArray(node)
		? node.every((innerNode) => isPrimaryKeyOnly(entity, innerNode))
		: isPrimaryKeyOnly(entity, node);
};

export const isCreateOrUpdate = async () => {};

// Used to check if we have only {id: ''} object
export const isPrimaryKeyOnly = <G = unknown, D = unknown>(
	entity: EntityMetadata<G, D>,
	node: Partial<G>
) => {
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entity) as keyof G;

	return (
		typeof node[primaryKeyField] !== 'undefined' &&
		node[primaryKeyField] !== null &&
		Object.keys(node).length === 1
	);
};

const runChildCreateOrUpdate = <G = unknown>(
	entityMetadata: EntityMetadata<any, any>,
	data: Partial<G> | Partial<G>[],
	context: BaseContext
): Promise<G | G[]> => {
	const graphQLType = graphQLTypeForEntity(entityMetadata, undefined);

	// This is a fake GraphQL Resolve Info we pass to ourselves so the resolver will return the correct
	// result type. The only things we read in it is the return type so we'll just stub that.
	const infoFacade: Partial<GraphQLResolveInfo> = {
		returnType: Array.isArray(data) ? new GraphQLList(graphQLType) : graphQLType,
	};

	return createOrUpdate({
		source: {} as Source,
		args: { input: data },
		context,
		info: infoFacade as GraphQLResolveInfo,
		fields: {} as ResolveTree,
	});
};

export const createOrUpdateEntities = async <G = unknown, D = unknown>(
	input: Partial<G> | Partial<G>[],
	meta: EntityMetadata<G, D>,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	if (!meta.provider) {
		throw new Error(`No provider found for ${meta.name}, cannot create or update entities`);
	}

	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;

	if (Array.isArray(input)) {
		// If input is an array, loop through the elements
		const nodes: Partial<G | null>[] = [];
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
		let parent: G | undefined | null = undefined;

		// Loop through the properties and check for nested entities
		for (const entry of Object.entries(input)) {
			const [key, childNode]: [string, Partial<G> | Partial<G>[]] = entry as any;

			// Check if the property represents a related entity
			const relationship = meta.fields[key];
			const { fieldType } = getFieldTypeWithMetadata(relationship.getType);
			const relatedEntityMetadata = graphweaverMetadata.metadataForType(fieldType);

			if (isEntityMetadata(relatedEntityMetadata)) {
				if (isSerializableGraphQLEntityClass(fieldType)) {
					// If it's a serializable entity, we should delegate the serialization to it.
					node[key as keyof typeof node] = fieldType.serialize({ value: childNode }) as
						| G[keyof G]
						| undefined;
				} else if (isLinking(relatedEntityMetadata, childNode)) {
					// If it's a linking entity or an array of linking entities, nothing to do here
				} else if (Array.isArray(childNode)) {
					// If we have an array, we may need to create the parent first as children need reference to the parent
					// As we are updating the parent from the child, we can remove this key
					delete node[key as keyof Partial<G>];

					// Check if we already have the parent ID
					let parentId = node[primaryKeyField] ?? parent?.[primaryKeyField];
					if (!parentId && !parent) {
						// If there's no ID, create the parent first
						const backendEntity =
							isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
								? meta.target.toBackendEntity(node)
								: (node as unknown as D);
						const parentDataEntity = await meta.provider.createOne(backendEntity);
						parent = fromBackendEntity(meta, parentDataEntity);
						parentId = parent?.[primaryKeyField];
					}

					// By now we should have a parent ID.
					if (!parentId) {
						throw new Error(
							`Implementation Error: No parent id found for ${relatedEntityMetadata.name}`
						);
					}

					// Add parent ID to children and perform the mutation
					const childEntities = childNode.map((child) => ({
						...child,
						[key]: { [primaryKeyField]: parentId },
					}));

					// Now create/update the children
					await runChildCreateOrUpdate(relatedEntityMetadata, childEntities, context);
				} else if (Object.keys(childNode).length > 0) {
					// If only one object, create or update it first, then update the parent reference
					const result = await runChildCreateOrUpdate(relatedEntityMetadata, childNode, context);

					// Now we need to pull the ID out to link the result.
					const primaryKeyField =
						graphweaverMetadata.primaryKeyFieldForEntity(relatedEntityMetadata);
					if (!primaryKeyField) {
						throw new Error(`No primary key field found for ${relatedEntityMetadata.name}`);
					}

					node = {
						...node,
						[key]: { [primaryKeyField]: result[primaryKeyField as keyof typeof result] },
					};
				}
			}
		}

		// Down here we have an entity and need to check if we need to create or update
		if (parent) {
			// We needed to create the parent earlier, no need to create it again
			return parent;
		} else if (isPrimaryKeyOnly(meta, node)) {
			// If it's just an ID, return it as is, but we need to fromBackendEntity it
			// so that it will have a reference back to its data entity.
			return fromBackendEntity(meta, node as D);
		} else {
			// Is it a create or an update?
			let operation: 'create' | 'update';
			// If client side ID generation is disabled, we can be sure it follows our old rules.
			if (!meta.apiOptions?.clientGeneratedPrimaryKeys) {
				operation =
					primaryKeyField in node && node[primaryKeyField] && Object.keys(node).length > 1
						? 'update'
						: 'create';
			} else {
				// Ok, this is a client generated primary key entity. That means we don't know which it is until we check
				// whether the entity exists in the first place.
				// If there's no primary key at this point, that's an error.
				const primaryKey = node[primaryKeyField];
				if (!primaryKey)
					throw new Error(
						'Cannot call create or update on a client generated primary key entity without specifying a primary key.'
					);

				const existing = await meta.provider.findOne({
					[primaryKeyField]: primaryKey,
				} as Filter<D>);
				operation = existing ? 'update' : 'create';
			}

			if (operation === 'update') {
				const result = await meta.provider.updateOne(
					String(node[primaryKeyField]),
					isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
						? meta.target.toBackendEntity(node)
						: (node as unknown as Partial<D>)
				);

				return fromBackendEntity(meta, result);
			} else if (operation === 'create') {
				const result = await meta.provider.createOne(
					isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
						? meta.target.toBackendEntity(node)
						: (node as unknown as Partial<D>)
				);

				return fromBackendEntity(meta, result);
			} else {
				throw new Error(`Unknown create or update operation: '${operation}'`);
			}
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
