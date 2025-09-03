import { logger } from '@exogee/logger';
import type { TypeValue, TraceOptions, Filter, PaginationOptions } from './types';
import { EntityMetadata, graphweaverMetadata } from './metadata';
import { TraceMethod } from './open-telemetry';

const operators = ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null', 'like', 'ilike'];

const getFieldFromEntity = (entityMetadata: EntityMetadata, fieldName: string) => {
	// Strip the operators out of the field name
	let normalisedFieldName = fieldName;
	for (const operator of operators) {
		if (fieldName.endsWith(`_${operator}`)) {
			normalisedFieldName = fieldName.replace(new RegExp(`_${operator}$`), '');
			break;
		}
	}

	const field = entityMetadata.fields[normalisedFieldName];

	if (!field) {
		throw new Error(`Could not locate '${fieldName}' field on entity '${entityMetadata.name}'`);
	}

	return field;
};

const entityNameFromType = (type: TypeValue) => (type as any).name || type.toString();

const visit = async (currentEntityMetadata: EntityMetadata, currentFilter: any) => {
	// If there's no filter at this level, it's fine, just bail.
	if (!currentFilter) {
		return {
			provider: currentEntityMetadata.provider,
			filter: currentFilter,
		};
	}

	for (const [fieldName, value] of Object.entries(currentFilter)) {
		if (Array.isArray(value)) {
			currentFilter[fieldName] = await Promise.all(
				value.map(async (entry) => {
					// Array operators are used for _and, _or, etc, so the actual metadata
					// doesn't change, we just need to visit on down the tree.
					const { filter } = await visit(currentEntityMetadata, entry);
					return filter;
				})
			);
		} else if (fieldName === '_not') {
			// The _not is an exception because the value is not an array, but it is just like above, we need
			// to visit on down the tree.
			const { filter } = await visit(currentEntityMetadata, value);
			currentFilter[fieldName] = filter;
		} else if (typeof value === 'object') {
			// Let's recurse. To do that we need to look up the field.
			const field = getFieldFromEntity(currentEntityMetadata, fieldName);

			// We only need to recurse on fields that actually have a target set.
			const nextMetadata = graphweaverMetadata.getEntityByName(entityNameFromType(field.getType()));
			if (nextMetadata) {
				// Let's look up the related entity and recurse
				const result = await visit(nextMetadata, value);

				// Ok, now that we've explored the branch, do we need to run a query and splatter our filter,
				// or are we good to just let this cascade on up?
				if (result.provider?.backendId !== currentEntityMetadata.provider?.backendId) {
					// Our backends are split, so we need to flatten down to a set of IDs.
					// Is the query already a set of IDs? If so let it go on through as an optimisation, as there's
					// no reason to go over the network to find the IDs for the list of IDs we already have.
					const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(nextMetadata);

					const [firstKey, ...rest] = Object.keys(result.filter);
					if (
						!result.provider ||
						(rest.length === 0 &&
							(firstKey === primaryKeyField || firstKey === `${primaryKeyField}_in`))
					) {
						// Nothing to do here, we can just let this cascade on up.
					} else {
						// Ok, we're filtering on something that isn't ID. Go get a list of IDs.
						const rows = await result.provider.find(result.filter, undefined, nextMetadata);

						// And now set it up like:
						// whatever: { PrimaryKey_in: [<ids we got from backend>] }
						currentFilter[fieldName] = {
							[`${primaryKeyField}_in`]: rows.map((row) => (row as any)[primaryKeyField]),
						};
					}
				}
			}
		}
	}

	return {
		provider: currentEntityMetadata.provider,
		filter: currentFilter,
	};
};

class QueryManagerImplementation {
	@TraceMethod()
	async find<D = unknown>(
		{
			entityMetadata,
			filter,
			pagination,
		}: {
			entityMetadata: EntityMetadata;
			filter?: Filter<D>;
			pagination?: PaginationOptions;
		},
		trace?: TraceOptions
	) {
		trace?.span.updateName(`Query Manager - Find ${entityMetadata.name}`);

		// If there's no provider for this section of the filter, then we can't do anything.
		if (!entityMetadata.provider) return [];

		logger.trace('Handling cross-datasource queries');
		logger.trace({ filter }, 'Original filter');
		const result = await visit(entityMetadata, filter);
		logger.trace({ filter }, 'Filter after ID flattening.');

		// Ok, at this point we're good to go, we can just pass the find on down to the provider.
		return entityMetadata.provider.find(result.filter, pagination, entityMetadata);
	}

	async flattenFilter<D = unknown>({
		entityMetadata,
		filter,
	}: {
		entityMetadata: EntityMetadata;
		filter?: Filter<D>;
	}) {
		logger.trace('Handling cross-datasource queries');
		logger.trace('Original filter: ', filter);
		const result = await visit(entityMetadata, filter);
		logger.trace('Filter after ID flattening: ', filter);

		return result.filter;
	}
}

export const QueryManager = new QueryManagerImplementation();
