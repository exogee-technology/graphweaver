import { GraphQLResolveInfo } from 'graphql';

import { HookRegister, hookManagerMap } from '../hook-manager';
import { EntityMetadata, graphweaverMetadata } from '../metadata';
import { BaseContext, CreateOrUpdateHookParams } from '../types';
import { generateOperationBatches, runBatchedWrites } from './batched-writes';

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

export const createOrUpdateEntities = async <G = unknown, D = unknown>(
	input: Partial<G> | Partial<G>[],
	meta: EntityMetadata<G, D>,
	info: GraphQLResolveInfo,
	context: BaseContext
) => {
	if (!meta.provider) {
		throw new Error(`No provider found for ${meta.name}, cannot create or update entities`);
	}

	try {
		const { tasks, nodes, batches, returnOrder } = await generateOperationBatches(
			input,
			meta,
			info,
			context
		);

		const result = await runBatchedWrites(batches, tasks, nodes, returnOrder);
		console.log('RESULT', result);
		return result;
	} catch (error) {
		// Ensure error is properly propagated with the message intact
		if (error instanceof Error) {
			throw error; // Just re-throw if it's already an Error object
		} else {
			throw new Error(String(error)); // Convert to Error if it's not
		}
	}
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
