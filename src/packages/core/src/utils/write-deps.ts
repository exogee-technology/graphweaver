import { isPrimaryKeyOnly, isSerializableGraphQLEntityClass } from '..';
import { EntityMetadata, graphweaverMetadata, isEntityMetadata } from '../metadata';
import { getFieldTypeWithMetadata } from '../schema-builder';
import { BaseContext, Filter, GraphQLResolveInfo } from '../types';
import { getGraphweaverMutationType } from './resolver.utils';

type WriteEdge<T> = {
	input: Partial<T>;
	meta: EntityMetadata<T, any>;
	operation: 'create' | 'update';
};

const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

const isLinking = <G = unknown, D = unknown>(
	entity: EntityMetadata<G, D>,
	node: Partial<G> | Partial<G>[]
) => {
	return Array.isArray(node)
		? node.every((innerNode) => isPrimaryKeyOnly(entity, innerNode))
		: isPrimaryKeyOnly(entity, node);
};

export const generateWriteDeps = async <G = unknown, D = unknown>(
	rootInput: Partial<G> | Partial<G>[],
	rootMeta: EntityMetadata<G, D>,
	rootInfo: GraphQLResolveInfo,
	rootContext: BaseContext
): Promise<any> => {
	if (!rootMeta.provider) {
		throw new Error(`No provider found for ${rootMeta.name}, cannot create or update entities`);
	}

	const edges: Array<[WriteEdge<G>, WriteEdge<G>]> = [];

	const operations = new Map<string, any>();

	const deps: Array<[string, string]> = [];

	async function traverse(
		input: Partial<G> | Partial<G>[],
		meta: EntityMetadata<G, D>,
		info: GraphQLResolveInfo,
		context: BaseContext,
		operationId: string,
		index: number,
		isDep: boolean
	): Promise<{
		produces: string;
		node: Partial<G>;
		meta: EntityMetadata<G, D>;
		operation: 'create' | 'update';
		wants: Record<string, string>;
	} | null> {
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;
		if (Array.isArray(input)) {
			const operation = await Promise.allSettled(
				input.map((node, i) => traverse(node, meta, info, context, operationId, i, isDep))
			).then((results) => {
				return results
					.filter((result) => result.status === 'fulfilled')
					.map((result) => result.value)
					.filter((result) => result !== null);
			});
			operations.set(operationId, operation);
			return null;
		} else if (isObject(input)) {
			let node = { ...input };
			const parentId = node[primaryKeyField];
			let wants: Record<string, string> = {};
			for (const entry of Object.entries(input)) {
				const [key, childNode]: [string, Partial<G> | Partial<G>[]] = entry as any;
				const relationship = meta.fields[key];
				const { fieldType } = getFieldTypeWithMetadata(relationship.getType);
				const relatedEntityMetadata = graphweaverMetadata.metadataForType(fieldType);
				if (isEntityMetadata(relatedEntityMetadata)) {
					if (isSerializableGraphQLEntityClass(fieldType)) {
						node[key as keyof typeof node] = fieldType.serialize({ value: childNode }) as
							| G[keyof G]
							| undefined;
					} else if (isLinking(relatedEntityMetadata, childNode)) {
						// If it's a linking entity or an array of linking entities, nothing to do here
					} else if (Array.isArray(childNode)) {
						// If we have an array, we may need to create the parent first as children need reference to the parent
						// As we are updating the parent from the child, we can remove this key
						delete node[key as keyof Partial<G>];

						const newOperationId = crypto.randomUUID();
						if (relationship.relationshipInfo?.relatedField) {
							deps.push([newOperationId, operationId]);
							wants[relationship.relationshipInfo?.relatedField] = `${newOperationId}:${index}`;
						}
						await traverse(
							childNode,
							relatedEntityMetadata,
							info,
							context,
							newOperationId,
							index,
							true
						);
					} else if (Object.keys(childNode).length > 0) {
						const newOperationId = crypto.randomUUID();
						if (relationship.relationshipInfo?.id) {
							deps.push([operationId, newOperationId]);
							await traverse(
								childNode,
								relatedEntityMetadata,
								info,
								context,
								newOperationId,
								index,
								false
							);
						} else if (relationship.relationshipInfo?.relatedField) {
							deps.push([newOperationId, operationId]);
							await traverse(
								childNode,
								relatedEntityMetadata,
								info,
								context,
								newOperationId,
								index,
								true
							);
						}
					}
				}
			}

			return {
				produces: String(primaryKeyField),
				node,
				meta,
				operation: await operationType(node, primaryKeyField, meta, info),
				wants,
			};
		} else {
			return null;
		}
	}

	if (Array.isArray(rootInput)) {
		await traverse(rootInput, rootMeta, rootInfo, rootContext, crypto.randomUUID(), 0, false);
	} else {
		throw new Error(`Unexpected Error: trying to create entity ${rootMeta.name}`);
	}

	return operations;
};

const operationType = async <G = unknown, D = unknown>(
	node: Partial<G>,
	primaryKeyField: keyof G,
	meta: EntityMetadata<G, D>,
	info: GraphQLResolveInfo
) => {
	let operation: 'create' | 'update' = 'create';

	// If there's an ID, we can't be certain whether it's an update or a create. It could be
	// a client-side primary key entity, or it could be a server side primary key entity where the
	// ID is coming from a hook. So if there's an ID, there's only one way to be sure
	// what the operation is, which is to check if it already exists or not.
	if (
		primaryKeyField in node &&
		node[primaryKeyField] &&
		Object.keys(node).length > 1 &&
		meta.provider
	) {
		const primaryKey = node[primaryKeyField];
		if (!primaryKey)
			throw new Error(
				'Cannot call create or update on a client generated primary key entity without specifying a primary key.'
			);

		const existing = await meta.provider.findOne({
			[primaryKeyField]: primaryKey,
		} as Filter<D>);
		const graphweaverMutationType = getGraphweaverMutationType(info);
		if (
			(graphweaverMutationType === 'createOne' || graphweaverMutationType === 'createMany') &&
			existing
		) {
			throw new Error(`Entity with ID ${primaryKey} already exists`);
		}

		operation = existing ? 'update' : 'create';
	}

	return operation;
};
