import type { FieldPolicy, TypePolicies } from '@apollo/client';

// Note: Entity metadata contains more than just these three fields,
//       but this is all that we need in the context of this example.
interface Entity {
	name: string;
	plural: string;
	primaryKeyField: string;
}

const generateTypePolicyFields = (entities: Entity[]) => {
	const policy: FieldPolicy<any> = {
		keyArgs: (
			args: {
				filter?: Record<string, unknown>;
				pagination?: { orderBy: Record<string, unknown> };
			} | null
		) => {
			// https://www.apollographql.com/docs/react/pagination/key-args/#keyargs-function-advanced
			const filter = args?.filter ? JSON.stringify(args.filter) : '';
			const orderBy = args?.pagination?.orderBy ? JSON.stringify(args.pagination.orderBy) : '';
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
	const result: TypePolicies = {};

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
