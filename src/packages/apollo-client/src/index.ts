const generateTypePolicyFields = (entityNames: string[]) => {
	const policy = {
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

	const mapEntityToPolicy = (entity: string) => ({
		[entity.charAt(0).toLowerCase() + entity.slice(1)]: policy,
	});

	return entityNames.map(mapEntityToPolicy).reduce((acc, policy) => ({ ...acc, ...policy }), {});
};

export const generateTypePolicies = (entityNames: string[]) => ({
	Query: {
		keyFields: ['id'], // This is the default and is here for clarity
		fields: generateTypePolicyFields(entityNames),
	},
});
