import { logger } from './logger';
import { TypeValue } from 'type-graphql/dist/decorators/types';

import { EntityMetadataMap } from './base-resolver';
import { BackendProvider, PaginationOptions } from './common/types';

const operators = ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null', 'like', 'ilike'];

const getFieldFromEntity = (entityName: string, fieldName: string) => {
	const metadata = EntityMetadataMap.get(entityName);
	if (!metadata)
		throw new Error(`Could not locate entity with name ${entityName} in metadata map.`);

	// Strip the operators out of the field name
	let normalisedFieldName = fieldName;
	for (const operator of operators) {
		if (fieldName.endsWith(`_${operator}`)) {
			normalisedFieldName = fieldName.replace(new RegExp(`_${operator}$`), '');
			break;
		}
	}

	const field = metadata.fields.find((field) => field.name === normalisedFieldName);
	if (!field) throw new Error(`Could not locate '${fieldName}' field on entity '${entityName}'`);

	return field;
};

const entityNameFromType = (type: TypeValue) => (type as any).name || type.toString();

const visit = async <T>(
	currentEntityName: string,
	currentProvider: BackendProvider<T>,
	currentFilter: any
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
					const { filter } = await visit(currentEntityName, currentProvider, entry);
					return filter;
				})
			);
		} else if (typeof value === 'object') {
			// Let's recurse. To do that we need to look up the field.
			const field = getFieldFromEntity(currentEntityName, fieldName);

			// We only need to recurse on fields that actually have a target set.
			const nextMetadata = EntityMetadataMap.get(entityNameFromType(field.getType()));
			if (nextMetadata) {
				// Let's look up the related entity and recurse
				const result = await visit(nextMetadata.entity.name, nextMetadata.provider, value);

				// Ok, now that we've explored the branch, do we need to run a query and splatter our filter,
				// or are we good to just let this cascade on up?
				if (result.provider.backendId !== currentProvider.backendId) {
					// Our backends are split, so we need to flatten down to a set of IDs.
					// Is the query already a set of IDs? If so let it go on through as an optimisation, as there's
					// no reason to go over the network to find the IDs for the list of IDs we already have.
					const [firstKey, ...rest] = Object.keys(result.filter);
					if (rest.length === 0 && (firstKey === 'id' || firstKey === 'id_in')) {
						// Nothing to do here, we can just let this cascade on up.
					} else {
						// Ok, we're filtering on something that isn't ID. Go get a list of IDs.
						const rows = await result.provider.find(result.filter);

						// And now set it up like:
						// whatever: { id_in: [<ids we got from backend>] }
						currentFilter[fieldName] = { id_in: rows.map((row) => (row as any).id) };
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
	find = async <T>({
		entityName,
		filter,
		pagination,
	}: {
		entityName: string;
		filter: Partial<T>;
		pagination: PaginationOptions;
	}) => {
		const metadata = EntityMetadataMap.get(entityName);
		if (!metadata) throw new Error(`Could not get provider for '${entityName}' entity.`);

		logger.trace('Handling cross-datasource queries');
		logger.trace('Original filter: ', filter);
		const result = await visit(entityName, metadata.provider, filter);
		logger.trace('Filter after ID flattening: ', filter);

		// Ok, at this point we're good to go, we can just pass the find on down to the provider.
		return metadata.provider.find(result.filter, pagination);
	};
}

export const QueryManager = new QueryManagerImplementation();
