import { isDefined } from 'class-validator';
import {
	fromBackendEntity,
	isPrimaryKeyOnly,
	isSerializableGraphQLEntityClass,
	isTransformableGraphQLEntityClass,
} from '..';
import { EntityMetadata, graphweaverMetadata, isEntityMetadata } from '../metadata';
import { getFieldTypeWithMetadata } from '../schema-builder';
import { BaseContext, Filter, GraphQLResolveInfo } from '../types';

import { getGraphweaverMutationType } from './resolver.utils';

const isObject = <G>(node: Partial<G> | Partial<G>[]) => typeof node === 'object' && node !== null;

const isLinking = <G = unknown, D = unknown>(
	entity: EntityMetadata<G, D>,
	node: Partial<G> | Partial<G>[]
) => {
	return Array.isArray(node)
		? node.every((innerNode) => isPrimaryKeyOnly(entity, innerNode))
		: isPrimaryKeyOnly(entity, node);
};

type OperationProcess<G> =
	| {
			type: 'post';
			inject: (value: (G & (object | undefined)) | null) => void;
	  }
	| {
			type: 'pre';
			fetch: any;
	  };

export const generateOperationBatches = async <G = unknown, D = unknown>(
	rootInput: Partial<G> | Partial<G>[],
	rootMeta: EntityMetadata<G, D>,
	rootInfo: GraphQLResolveInfo,
	rootContext: BaseContext
) => {
	const deps: Array<[string, string]> = [];
	const returnOrder: string[] = [];
	const tasks = new Map<
		string,
		{
			meta: EntityMetadata<G, D>;
			operations: Array<{
				nodeId: string;
				type: 'create' | 'update' | 'skip';
				processing: OperationProcess<G>[];
			}>;
		}
	>();
	const nodes = new Map<string, Partial<G>>();

	const preReturnSteps: {
		handler: () => void;
	}[] = [];
	const preReturnHandler =
		(targetNodeId: string, value: Record<string, object | string | number | boolean | symbol>) =>
		() => {
			const targetNode = nodes.get(targetNodeId);
			if (!targetNode || !value) {
				throw new Error(`Source node ${targetNodeId} not found`);
			}

			const newValues = { ...targetNode, ...value };
			nodes.set(targetNodeId, newValues);
		};

	const dependencyInjector =
		(primaryKey: string) =>
		(targetNodeId: string, foreignKey: string) =>
		(value: (G & (object | undefined)) | null) => {
			const targetNode = nodes.get(targetNodeId);
			if (!targetNode || !value || !value.hasOwnProperty(primaryKey)) {
				throw new Error(`Source node ${targetNodeId} not found`);
			}

			targetNode[foreignKey as keyof typeof targetNode] = {
				[primaryKey as keyof typeof value]: value[primaryKey as keyof typeof value] as G[keyof G],
			} as G[keyof G];
			return;
		};

	const fetchDependency =
		(sourceNodeId: string, targetNodeId: string, sourceKey: string, targetKey: string) => () => {
			const sourceNode = nodes.get(sourceNodeId);
			const targetNode = nodes.get(targetNodeId);
			if (!sourceNode || !targetNode) {
				throw new Error(`Source node ${sourceNodeId} not found`);
			}
			const sourceValue = {
				[sourceKey]: sourceNode[sourceKey as keyof typeof sourceNode],
			};
			targetNode[targetKey as keyof typeof targetNode] = sourceValue as G[keyof G];
			nodes.set(targetNodeId, targetNode);
		};

	async function traverse(
		input: Partial<G> | Partial<G>[],
		meta: EntityMetadata<G, D>,
		info: GraphQLResolveInfo,
		context: BaseContext,
		operationId: string,
		index: number
	): Promise<{
		nodeId: string;
		type: 'create' | 'update' | 'skip';
		processing: OperationProcess<G>[];
	} | null> {
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;
		let type: 'create' | 'update' | 'skip' = 'create';
		if (Array.isArray(input)) {
			const results = await Promise.allSettled(
				input.map((node, i) => traverse(node, meta, info, context, operationId, i))
			);

			// Check for any rejected promises and throw the first error
			const errors = results.filter(
				(result) => result.status === 'rejected'
			) as PromiseRejectedResult[];
			if (errors.length > 0) {
				const reason = errors[0].reason;
				// Make sure we're throwing an Error object
				if (reason instanceof Error) {
					throw reason;
				} else {
					throw new Error(String(reason));
				}
			}

			const operations = results
				.filter(
					(
						result
					): result is PromiseFulfilledResult<{
						nodeId: string;
						type: 'create' | 'update';
						processing: OperationProcess<G>[];
					} | null> => result.status === 'fulfilled'
				)
				.map((result) => result.value)
				.filter(
					(
						result
					): result is {
						nodeId: string;
						type: 'create' | 'update';
						processing: OperationProcess<G>[];
					} => result !== null
				);

			tasks.set(operationId, {
				meta,
				operations,
			});
			return null;
		} else if (isObject(input)) {
			const node = { ...input };
			type = await operationType(node, primaryKeyField, meta, info).catch((e) => {
				throw e;
			});
			const nodeId = `${operationId}:${index}`;
			// Object containing instructions on what this operation should do once it has finished
			const operationProcesses: Array<OperationProcess<G>> = [];
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
							const relatedField = relationship.relationshipInfo?.relatedField;
							deps.push([newOperationId, operationId]);
							const injector = dependencyInjector(String(primaryKeyField).toString());
							childNode.forEach((_, i) => {
								operationProcesses.push({
									inject: injector(`${newOperationId}:${i}`, relatedField),
									type: 'post' as const,
								});
							});

							if (['skip', 'update'].includes(type)) {
								childNode.forEach((child, i) => {
									if (!Object.keys(child).includes(relatedField)) {
										const preReturnStep = preReturnHandler(`${newOperationId}:${i}`, {
											[relatedField]: {
												[primaryKeyField]: node[primaryKeyField],
											},
										});
										preReturnSteps.push({
											handler: preReturnStep,
										});
									}
								});
							}
						}

						await traverse(childNode, relatedEntityMetadata, info, context, newOperationId, index);
					} else if (Object.keys(childNode).length > 0) {
						const newOperationId = crypto.randomUUID();
						if (relationship.relationshipInfo?.id) {
							delete node[key as keyof Partial<G>];
							deps.push([operationId, newOperationId]);
							operationProcesses.push({
								fetch: fetchDependency(
									`${newOperationId}:${index}`,
									`${operationId}:${index}`,
									String(relatedEntityMetadata.primaryKeyField).toString(),
									key
								),
								type: 'pre' as const,
							});
							await traverse(
								childNode,
								relatedEntityMetadata,
								info,
								context,
								newOperationId,
								index
							).then((res) => {
								if (res) {
									tasks.set(newOperationId, {
										meta: relatedEntityMetadata,
										operations: [res],
									});
								}
							});
						} else if (relationship.relationshipInfo?.relatedField) {
							const relatedField = relationship.relationshipInfo?.relatedField;
							deps.push([newOperationId, operationId]);
							if (['skip', 'update'].includes(type)) {
								if (!Object.keys(childNode).includes(relatedField)) {
									const preReturnStep = preReturnHandler(`${newOperationId}:${index}`, {
										[relatedField]: {
											[primaryKeyField]: node[primaryKeyField],
										},
									});
									preReturnSteps.push({
										handler: preReturnStep,
									});
								}
							} else {
								const injector = dependencyInjector(String(primaryKeyField).toString());
								operationProcesses.push({
									inject: injector(`${newOperationId}:${index}`, relatedField),
									type: 'post',
								});
							}
							await traverse(
								childNode,
								relatedEntityMetadata,
								info,
								context,
								newOperationId,
								index
							).then((res) => {
								if (res) {
									tasks.set(newOperationId, {
										meta: relatedEntityMetadata,
										operations: [res],
									});
								}
							});
						}
					}
				}
			}
			nodes.set(nodeId, node);

			returnOrder.push(nodeId);
			return {
				nodeId,
				type: type as 'create' | 'update' | 'skip',
				processing: operationProcesses,
			};
		} else {
			return null;
		}
	}

	if (Array.isArray(rootInput)) {
		await traverse(rootInput, rootMeta, rootInfo, rootContext, crypto.randomUUID(), 0).catch(
			(e) => {
				throw e;
			}
		);
	} else {
		throw new Error(`Unexpected Error: trying to create entity ${rootMeta.name}`);
	}

	const batches =
		deps.length > 0 ? layeredToposort(Array.from(tasks.keys()), deps) : [Array.from(tasks.keys())];

	await Promise.all(preReturnSteps.map((step) => step.handler()));

	return {
		tasks,
		nodes,
		batches,
		returnOrder: returnOrder.reverse(),
	};
};

export const runBatchedWrites = async <G = unknown, D = unknown>(
	batches: Array<string[]>,
	tasks: Map<
		string,
		{
			meta: EntityMetadata<G, D>;
			operations: Array<{
				nodeId: string;
				type: 'create' | 'update' | 'skip';
				processing: OperationProcess<G>[];
			}>;
		}
	>,
	nodes: Map<string, Partial<G>>,
	returnOrder: string[]
): Promise<Partial<G | null>[] | (G & {}) | null | undefined> => {
	const results: Map<string, (G & ({} | undefined)) | null> = new Map();
	for (const batch of batches) {
		const promises: Promise<any>[] = [];
		for (const nodeId of batch) {
			const { meta, operations } = tasks.get(nodeId)!;
			const creates = operations.filter((operation) => operation.type === 'create');
			const updates = operations.filter((operation) => operation.type === 'update');

			// Handle any pre-processing steps
			for (const { processing } of operations) {
				for (const process of processing.filter((process) => process.type === 'pre')) {
					const { fetch } = process;
					fetch();
				}
			}

			// Create promise
			if (creates.length === 1) {
				promises.push(
					createOne(meta, nodes.get(creates[0].nodeId)!).then((result) => {
						for (const process of creates[0].processing.filter(
							(process) => process.type === 'post'
						)) {
							const { inject } = process;
							inject(result);
						}
						const toUpdate = nodes.get(creates[0].nodeId)!;
						if (result) {
							Object.keys(result).forEach((key) => {
								if (typeof key === 'string') {
									toUpdate[key as keyof G] = result[key as keyof G];
								}
							});
						}
						nodes.set(creates[0].nodeId, toUpdate);
						results.set(creates[0].nodeId, result);
					})
				);
			} else if (creates.length > 1) {
				promises.push(
					createMany(
						meta,
						creates.map((create) => nodes.get(create.nodeId)!)
					).then((res) => {
						for (let i = 0; i < creates.length; i++) {
							const result = res[i];
							for (const process of creates[i].processing.filter(
								(process) => process.type === 'post'
							)) {
								const { inject } = process;
								inject(result);
							}
							const toUpdate = nodes.get(creates[i].nodeId)!;
							if (result) {
								Object.keys(result).forEach((key) => {
									if (typeof key === 'string') {
										toUpdate[key as keyof G] = result[key as keyof G];
									}
								});
							}
							nodes.set(creates[i].nodeId, toUpdate);
							results.set(creates[i].nodeId, result);
						}
						return;
					})
				);
			}

			// Update promises
			if (updates.length === 1) {
				promises.push(
					updateOne(meta, nodes.get(updates[0].nodeId)!).then((result) => {
						for (const process of updates[0].processing.filter(
							(process) => process.type === 'post'
						)) {
							const { inject } = process;
							inject(result);
						}
						const toUpdate = nodes.get(creates[0].nodeId)!;
						if (result) {
							Object.keys(result).forEach((key) => {
								if (typeof key === 'string') {
									toUpdate[key as keyof G] = result[key as keyof G];
								}
							});
						}
						nodes.set(updates[0].nodeId, toUpdate);
						results.set(updates[0].nodeId, result);
						return;
					})
				);
			} else if (updates.length > 1) {
				promises.push(
					updateMany(
						meta,
						updates.map((update) => nodes.get(update.nodeId)!)
					).then((res) => {
						for (let i = 0; i < updates.length; i++) {
							const result = res[i];
							for (const process of updates[i].processing.filter(
								(process) => process.type === 'post'
							)) {
								const { inject } = process;
								inject(result);
							}
							const toUpdate = nodes.get(updates[i].nodeId)!;
							if (result) {
								Object.keys(result).forEach((key) => {
									if (typeof key === 'string') {
										toUpdate[key as keyof G] = result[key as keyof G];
									}
								});
							}
							nodes.set(updates[i].nodeId, toUpdate);
							results.set(updates[i].nodeId, result);
						}
						return;
					})
				);
			}
		}

		// Use Promise.all here instead of allSettled to ensure errors propagate up
		await Promise.all(promises);
	}

	return returnOrder.map((nodeId) => results.get(nodeId)!);
};

const createOne = async <G = unknown, D = unknown>(
	meta: EntityMetadata<G, D>,
	node: Partial<G>
) => {
	if (!meta || !meta.provider) {
		throw new Error('Missing metadata or provider');
	}
	const clientGeneratedPrimaryKeys = meta.apiOptions?.clientGeneratedPrimaryKeys;
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;
	if (isDefined(node[primaryKeyField]) && clientGeneratedPrimaryKeys !== true) {
		throw new Error(
			`Cannot create entity with ID '${node[primaryKeyField]}' because clientGeneratedPrimaryKeys is not enabled.`
		);
	}
	const createdEntity = await meta.provider.createOne(
		isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
			? meta.target.toBackendEntity(node)
			: (node as unknown as Partial<D>)
	);

	return fromBackendEntity(meta, createdEntity);
};

const createMany = async <G = unknown, D = unknown>(
	meta: EntityMetadata<G, D>,
	nodes: Partial<G>[]
) => {
	if (!meta || !meta.provider) {
		throw new Error('Missing metadata or provider');
	}
	const clientGeneratedPrimaryKeys = meta.apiOptions?.clientGeneratedPrimaryKeys;
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;

	if (nodes.some((n) => isDefined(n[primaryKeyField])) && clientGeneratedPrimaryKeys !== true) {
		throw new Error(
			`Cannot create entity with ID because clientGeneratedPrimaryKeys is not enabled.`
		);
	}

	const createdEntities = await meta.provider.createMany(
		nodes.map((n) =>
			isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
				? meta.target.toBackendEntity(n)
				: (n as unknown as Partial<D>)
		)
	);

	return createdEntities.map((entity) => fromBackendEntity(meta, entity));
};

const updateOne = async <G = unknown, D = unknown>(
	meta: EntityMetadata<G, D>,
	node: Partial<G>
) => {
	if (!meta || !meta.provider) {
		throw new Error('Missing metadata or provider');
	}
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;
	const result = await meta.provider.updateOne(
		String(node[primaryKeyField]),
		isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
			? meta.target.toBackendEntity(node)
			: (node as unknown as Partial<D>)
	);

	return fromBackendEntity(meta, result);
};

const updateMany = async <G = unknown, D = unknown>(
	meta: EntityMetadata<G, D>,
	nodes: Partial<G>[]
) => {
	if (!meta || !meta.provider) {
		throw new Error('Missing metadata or provider');
	}
	const clientGeneratedPrimaryKeys = meta.apiOptions?.clientGeneratedPrimaryKeys;
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(meta) as keyof G;

	if (nodes.some((n) => isDefined(n[primaryKeyField])) && clientGeneratedPrimaryKeys !== true) {
		throw new Error(
			`Cannot create entity with ID because clientGeneratedPrimaryKeys is not enabled.`
		);
	}

	const createdEntities = await meta.provider.updateMany(
		nodes.map((n) =>
			isTransformableGraphQLEntityClass<G, D>(meta.target) && meta.target.toBackendEntity
				? meta.target.toBackendEntity(n)
				: (n as unknown as Partial<D>)
		)
	);

	return createdEntities.map((entity) => fromBackendEntity(meta, entity));
};

const operationType = async <G = unknown, D = unknown>(
	node: Partial<G>,
	primaryKeyField: keyof G,
	meta: EntityMetadata<G, D>,
	info: GraphQLResolveInfo
) => {
	let operation: 'create' | 'update' | 'skip' = 'create';

	/**
	 * If there's an ID, we can't be certain whether it's an update, or a create with a client-side key.
	 *
	 */

	const isConfiguredForClientSideKeys = !!meta.apiOptions?.clientGeneratedPrimaryKeys;
	const hasOtherKeys = Object.keys(node).length > 1;

	if (primaryKeyField in node && node[primaryKeyField] && meta.provider) {
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

		if (existing && hasOtherKeys) {
			operation = 'update';
		} else if (existing && !hasOtherKeys) {
			operation = 'skip';
		} else if (!existing && isConfiguredForClientSideKeys) {
			operation = 'create';
		} else {
			throw new Error(
				`Cannot create entity with ID '${node[primaryKeyField]}' because clientGeneratedPrimaryKeys is not enabled.`
			);
		}
	}

	return operation;
};

type Edge<T> = [T, T];

/**
 * Layered topological sort: returns an array of batches,
 * where each batch can be run in parallel.
 */
const layeredToposort = <T>(nodes: T[], edges: Edge<T>[]): T[][] => {
	// 1) Build adjacency list and in-degree map
	const adj = new Map<T, T[]>();
	const inDegree = new Map<T, number>();
	nodes.forEach((n) => {
		adj.set(n, []);
		inDegree.set(n, 0);
	});

	edges.forEach(([u, v]) => {
		if (!adj.has(u) || !adj.has(v)) {
			throw new Error(`Unknown node in edges: ${u} → ${v}`);
		}
		adj.get(u)!.push(v);
		inDegree.set(v, inDegree.get(v)! + 1);
	});

	// 2) Initialize first layer: all nodes with in-degree = 0
	const result: T[][] = [];
	let layer = nodes.filter((n) => inDegree.get(n)! === 0);

	// 3) Peel off layers
	while (layer.length) {
		result.push(layer);
		const next: T[] = [];

		for (const u of layer) {
			for (const v of adj.get(u)!) {
				const newDeg = inDegree.get(v)! - 1;
				inDegree.set(v, newDeg);
				if (newDeg === 0) {
					next.push(v);
				}
			}
		}

		layer = next;
	}

	// 4) If there are still edges, there was a cycle
	if (Array.from(inDegree.values()).some((d) => d > 0)) {
		throw new Error('Cyclic dependency detected');
	}

	return result.reverse();
};
