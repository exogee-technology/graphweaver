import pluralize from 'pluralize';

import { EntityMetadataMap } from '@exogee/graphweaver';
import { getMetadataStorage } from 'type-graphql';
import { ArgParamMetadata } from 'type-graphql/dist/metadata/definitions';

// Type guard for params that are arg kind
export const isArg = (param: any): param is ArgParamMetadata => {
	return param.kind === 'arg';
};

export const removeInvalidFilterArg = () => {
	const typeGraphQLMetadata = getMetadataStorage();

	// Remove the filter arg from typegraphql metadata
	// All RelationshipField's default to having a filter arg
	// Check to ensure the provider supports filtering
	typeGraphQLMetadata.params = typeGraphQLMetadata.params.filter((param) => {
		// Don't touch non-filter params
		if (!isArg(param) || (isArg(param) && param.name !== 'filter')) {
			return true;
		}

		const eMapKey =
			pluralize.singular(param.methodName).charAt(0).toUpperCase() +
			pluralize.singular(param.methodName).slice(1);

		// If this param's methodName is not in the EntityMetadataMap, don't touch it
		if (!EntityMetadataMap.has(pluralize.singular(eMapKey))) {
			return true;
		}
		const entityMetadata = EntityMetadataMap.get(pluralize.singular(eMapKey));
		// If this provider supports filtering, keep the param, otherwise remove it
		if (entityMetadata?.provider?.backendProviderConfig?.filter?.childByChild) {
			return true;
		}

		return false;
	});
};
