import { logger } from '@exogee/logger';
import { TypeValue } from './types';

import { BackendProvider, Filter, PaginationOptions, Trace } from './types';
import { graphweaverMetadata } from './metadata';
import { TraceMethod } from './open-telemetry';

const operators = ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null', 'like', 'ilike'];

const getFieldFromEntity = (entityName: string, fieldName: string) => {
	const metadata = graphweaverMetadata.getEntityByName(entityName);
	if (!metadata) throw new Error(`Could not locate entity '${entityName}'`);

	// Strip the operators out of the field name
	let normalisedFieldName = fieldName;
	for (const operator of operators) {
		if (fieldName.endsWith(`_${operator}`)) {
			normalisedFieldName = fieldName.replace(new RegExp(`_${operator}$`), '');
			break;
		}
	}

	const field = metadata.fields[normalisedFieldName];

	if (!field) throw new Error(`Could not locate '${fieldName}' field on entity '${entityName}'`);

	return field;
};

const entityNameFromType = (type: TypeValue) => (type as any).name || type.toString();

const visit = async <D>(
	currentEntityName: string,
	currentFilter: any,
	currentProvider?: BackendProvider<D>
) => {
	// If there's no filter at this level, it's fine, just bail.
	if (!currentFilter) {
		return {
			provider: currentProvider,
			filter: currentFilter,
		};
	}

	for (const [fieldName, value] of Object.entries(currentFilter)) {
		if (Array.isArray(value)) {
			currentFilter[fieldName] = await Promise.all(
				value.map(async (entry) => {
					// Array operators are used for _and, _or, etc, so the actual metadata
					// doesn't change, we just need to visit on down the tree.
					const { filter } = await visit(currentEntityName, entry, currentProvider);
					return filter;
				})
			);
		} else if (typeof value === 'object') {
			// Let's recurse. To do that we need to look up the field.
			const field = getFieldFromEntity(currentEntityName, fieldName);

			// We only need to recurse on fields that actually have a target set.
			const nextMetadata = graphweaverMetadata.getEntityByName(entityNameFromType(field.getType()));
			if (nextMetadata) {
				// Let's look up the related entity and recurse
				const result = await visit(nextMetadata.name, value, nextMetadata.provider);

				// Ok, now that we've explored the branch, do we need to run a query and splatter our filter,
				// or are we good to just let this cascade on up?
				if (result.provider?.backendId !== currentProvider?.backendId) {
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
						const rows = await result.provider.find(result.filter);

						// And now set it up like:
						// whatever: { id_in: [<ids we got from backend>] }
						currentFilter[fieldName] = {
							[`${primaryKeyField}_in`]: rows.map((row) => (row as any).id),
						};
					}
				}
			}
		}
	}

	return {
		provider: currentProvider,
		filter: currentFilter,
	};
};

class QueryManagerImplementation {
	@TraceMethod()
	async find<G = unknown, D = unknown>(
		{
			entityName,
			filter,
			pagination,
		}: {
			entityName: string;
			filter?: Filter<D>;
			pagination?: PaginationOptions;
		},
		trace?: Trace
	) {
		trace?.span.updateName(`Query Manager - Find ${entityName}`);
		const metadata = graphweaverMetadata.getEntityByName<G, D>(entityName);
		if (!metadata) throw new Error(`Could not locate entity '${entityName}'`);

		// If there's no provider for this section of the filter, then we can't do anything.
		if (!metadata.provider) return [];

		logger.trace('Handling cross-datasource queries');
		logger.trace('Original filter: ', filter);
		const result = await visit(entityName, filter, metadata.provider);
		logger.trace('Filter after ID flattening: ', filter);

		// Ok, at this point we're good to go, we can just pass the find on down to the provider.
		return metadata.provider.find(result.filter, pagination);
	}

	async flattenFilter<G = unknown, D = unknown>({
		entityName,
		filter,
	}: {
		entityName: string;
		filter?: Filter<D>;
	}) {
		const metadata = graphweaverMetadata.getEntityByName<G, D>(entityName);
		if (!metadata) throw new Error(`Could not locate entity '${entityName}'`);

		logger.trace('Handling cross-datasource queries');
		logger.trace('Original filter: ', filter);
		const result = await visit(entityName, filter, metadata.provider);
		logger.trace('Filter after ID flattening: ', filter);

		return result.filter;
	}
}

export const QueryManager = new QueryManagerImplementation();
