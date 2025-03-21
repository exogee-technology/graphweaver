import type { FieldPolicy, TypePolicies } from '@apollo/client';

// Note: Entity metadata contains more than just these three fields,
//       but this is all that we need in the context of this example.
interface Entity {
	name: string;
	plural: string;
	primaryKeyField: string;
}

enum Sort {
	ASC = 'ASC',
	DESC = 'DESC',
}

type SortEntity = Record<string, Sort>;

export const stabilizationKeys = Symbol('stabilization');

export interface FilterWithStabilization {
	[stabilizationKeys]: string[];
	[key: string]: unknown;
}

const generateTypePolicyFields = (entities: Entity[]) => {
	const policy: FieldPolicy<any> = {
		keyArgs: (
			args: {
				filter?: Record<string, unknown>;
				pagination?: { orderBy: Record<string, unknown> };
			} | null
		) => {
			// Remove Order Stabilization Keys
			const filters = (args?.filter ?? {}) as unknown as FilterWithStabilization;
			if (filters[stabilizationKeys]) {
				const keys = filters[stabilizationKeys];
				for (const key of keys) {
					delete filters[key as keyof typeof filters];
				}
			}

			const filter = JSON.stringify(filters);
			const orderBy = args?.pagination?.orderBy ? JSON.stringify(args.pagination.orderBy) : '';

			// https://www.apollographql.com/docs/react/pagination/key-args/#keyargs-function-advanced
			return btoa(`${filter}:${orderBy}`);
		},
		merge(existing = [], incoming: { __ref: string }[]) {
			const mergeMap = new Map<string, { __ref: string }>();
			for (const entity of [...existing, ...incoming]) {
				mergeMap.set(entity.__ref, entity);
			}
			return [...mergeMap.values()];
		},
	};

	const mapEntityToPolicy = (entity: Entity) => ({
		[entity.plural.charAt(0).toLowerCase() + entity.plural.slice(1)]: policy,
	});

	return entities.map(mapEntityToPolicy).reduce((acc, policy) => ({ ...acc, ...policy }), {});
};

export const generateTypePolicies = (entities: Entity[]) => {
	const result: TypePolicies = {
		// AggregationResult objects don't have any ID field at all, so they cannot be cached.
		AggregationResult: { keyFields: false },
	};

	for (const entity of entities) {
		if (result[entity.name]) throw new Error(`Duplicate entity name: '${entity.name}'`);

		result[entity.name] = { keyFields: [entity.primaryKeyField] };
	}

	if (result.Query) throw new Error(`Duplicate entity name: 'Query'`);

	result.Query = {
		fields: generateTypePolicyFields(entities),
	};

	return result;
};

export const addStabilizationToFilter = <TData>(
	filter: Record<string, unknown>,
	sort: SortEntity,
	lastElement: TData
) => {
	const filters = {
		...filter,
	} as FilterWithStabilization;

	const keys = Object.keys(sort);
	for (const key of keys) {
		const isDesc = sort[key] === Sort.DESC;
		const operationKey = isDesc ? 'lte' : 'gte';

		filters[stabilizationKeys] = filters[stabilizationKeys] ?? [];
		filters[stabilizationKeys].push(`${key}_${operationKey}`);
		filters[`${key}_${operationKey}`] = lastElement[key as keyof TData];
	}

	return filters;
};
