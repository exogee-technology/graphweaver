import { GraphQLResolveInfo } from 'graphql';
import { GraphweaverSchemaInfoExtensionWithSourceEntity } from '../schema-builder.js';
import { BaseContext } from '@apollo/server';
import { dataEntityForGraphQLEntity } from '../default-from-backend-entity.js';
import { Filter, ReadHookParams, ResolverOptions } from '../types';
import { EntityMetadata } from '../metadata.js';
import { isScalarType } from 'graphql';
import { getFieldType } from '../schema-builder.js';
import { logger } from '@exogee/logger';
import { BaseLoaders } from '../base-loader.js';
import { isDefined } from '../utils/index.js';

export const getGraphweaverMutationType = (
	info: GraphQLResolveInfo
): GraphweaverSchemaInfoExtensionWithSourceEntity['type'] | undefined => {
	return (
		info?.schema?.getMutationType?.()?.getFields?.()[info?.fieldName]?.extensions
			?.graphweaverSchemaInfo as GraphweaverSchemaInfoExtensionWithSourceEntity | undefined
	)?.type;
};

export type ID = string | number | bigint;

/**
 * Retrieves the ID value from the source data.
 * If the id is a function then it calls it to get the ID value.
 * If the id is a string then it tries to get the value from the source data.
 */
export const getIdValue = <G, D>(
	id: string | bigint | ((dataEntity: D) => string | number | bigint | undefined) | undefined,
	source: G
) => {
	let idValue: ID | ID[] | undefined = undefined;
	if (id && typeof id === 'function') {
		// If the id is a function, we'll call it with the source data to get the id value.
		idValue = id(dataEntityForGraphQLEntity(source as any) as any);
	} else if (id) {
		// else if the id is a string, we'll try to get the value from the source data.
		const valueOfForeignKey = dataEntityForGraphQLEntity<G, D>(source as any)?.[id as keyof D];

		// If the value is a string or number, we'll use it as the id value.
		if (
			typeof valueOfForeignKey === 'string' ||
			typeof valueOfForeignKey === 'number' ||
			typeof valueOfForeignKey === 'bigint' ||
			Array.isArray(valueOfForeignKey)
		) {
			idValue = valueOfForeignKey;
		} else if (!isDefined(valueOfForeignKey)) {
			// If the value is null, we'll use it as the id value.
			idValue = undefined;
		} else {
			// The ID value must be a string or a number otherwise we'll throw an error.
			throw new Error(
				'Could not determine ID value for relationship field. Only strings, numbers or arrays of strings or numbers are supported.'
			);
		}
	}

	return idValue;
};

interface ConstructFilterForRelatedEntityParams<G, R, C extends BaseContext> {
	resolverOptions: ResolverOptions<{ filter: Filter<R> }, C, G>;
	idValue: ID | ID[] | undefined;
	relatedPrimaryKeyField: string;
	relatedField: string | undefined;
	relatedEntityMetadata: EntityMetadata;
	sourcePrimaryKeyField: keyof G;
}

/**
 * For this entity we may get a filter, this is the filter passed by the client for this entity,
 * we then get this filter and _and it with the filter for the relationship.
 * Both the resulting filter and the relationship filter are returned so that later we can remove the relationship filter from the filter.
 */
export const constructFilterForRelatedEntity = <G, R, C extends BaseContext>(
	params: ConstructFilterForRelatedEntityParams<G, R, C>
) => {
	const {
		resolverOptions: {
			source,
			args: { filter },
		},
		idValue,
		relatedPrimaryKeyField,
		relatedField,
		relatedEntityMetadata,
		sourcePrimaryKeyField,
	} = params;
	const _and: Filter<R>[] = [];

	// If we have a user supplied filter, add it to the _and array.
	if (filter) _and.push(filter);

	// Lets check the relationship type and add the appropriate filter.
	let relationshipFilterChunk: Filter<R> | undefined = undefined;

	if (idValue) {
		if (Array.isArray(idValue)) {
			relationshipFilterChunk = { [`${relatedPrimaryKeyField}_in`]: idValue } as Filter<R>;
		} else {
			relationshipFilterChunk = { [relatedPrimaryKeyField]: idValue } as Filter<R>;
		}
	} else if (
		relatedField &&
		isScalarType(getFieldType(relatedEntityMetadata.fields[relatedField]))
	) {
		// Scalars should get a simple filter, e.g. if we have Tasks in a DB which have a userId field, and we
		// have Users in a REST API with their PK called 'key', instead of trying to filter like:
		// { userId: { key: '1' } }
		// we should instead filter like:
		// { userId: '1' }
		// because the database provider doesn't understand the shape of the user object at all.
		relationshipFilterChunk = {
			[relatedField]: source[sourcePrimaryKeyField],
		} as unknown as Filter<R>;
	} else if (relatedField) {
		// While object filters should nest as not all providers understand what { user: '1' } means. It's more
		// clear to give them { user: { key: '1' } }.
		relationshipFilterChunk = {
			[relatedField]: { [sourcePrimaryKeyField]: source[sourcePrimaryKeyField] },
		} as Filter<R>;
	} else {
		throw new Error(
			'Did not determine how to filter the relationship. Either id or relatedField is required.'
		);
	}

	if (relationshipFilterChunk) _and.push(relationshipFilterChunk);

	const relatedEntityFilter = { _and } as Filter<R>;

	return { relatedEntityFilter, relationshipFilterChunk };
};

/**
 * To load the entities in bulk, we need a filter that doesn't contain the relationship filter.
 * This function will remove the relationship filter from the filter.
 */
export const getLoaderFilter = <R>(
	hookParams: ReadHookParams<R, object>,
	relationshipFilterChunk: Filter<R>
) => {
	let relationshipFilterChunkFound = !relationshipFilterChunk;
	/**
	 * Look for `relationshipFilterChunk` and remove it from the filter.
	 * This is necessary because we are batch loading data and that relationshipFilterChunk makes the filter different for each record, which ends up triggering a SQL query for each record (not batching at all).
	 * What we want to achieve is having a filter with ACLs into it, but without the relationship chunk.
	 * Note that the relationship chunk is _and-ed with the user supplied filter.
	 */
	const removeRelationshipFilterChunk = (
		filter: Filter<R> | undefined,
		relationshipFilterChunk: Filter<R>
	): Filter<R> | undefined => {
		if (!filter?._and) return filter;
		return {
			// We only need to look at the _and because `constructFilterForRelatedEntity` _ands the relationship filter with the user supplied filter. User supplied filter is untouched.
			_and: filter._and.map((item) => {
				if (item === relationshipFilterChunk) {
					relationshipFilterChunkFound = true;
					return undefined;
				}
				if (item._and) {
					// nested _and, we need to look here too
					return removeRelationshipFilterChunk(item, relationshipFilterChunk);
				}
				return item;
			}),
		} as Filter<R>;
	};

	const loaderFilter = removeRelationshipFilterChunk(
		hookParams.args?.filter,
		relationshipFilterChunk
	);

	if (!relationshipFilterChunkFound) {
		// If we are getting this error, make sure `removeRelationshipFilterChunk` is working as expected.
		throw new Error(
			'No relationship filter found in hook params. This usually means a hook has deep cloned the filter. Please add to the object instead of cloning it if possible. If this limitation is problematic open a GitHub issue so we can understand your use case better.'
		);
	}

	return loaderFilter;
};

interface GetDataEntitiesParams<G, D, R> {
	source: G;
	idValue: ID | ID[] | undefined;
	field: EntityMetadata<G, D>['fields'][string];
	sourcePrimaryKeyField: keyof G;
	loaderFilter: Filter<R> | undefined;
	gqlEntityType: { new (...args: any[]): R };
}

/**
 * Fetches the data entities for the given field.
 * If the field has a relatedField, it will use the relatedField to load the data entities.
 * If the field has an id, it will use the id to load the data entities.
 */
export const getDataEntities = async <G, D, R>(params: GetDataEntitiesParams<G, D, R>) => {
	const { source, idValue, field, gqlEntityType, sourcePrimaryKeyField, loaderFilter } = params;
	let dataEntities: D[] | undefined = undefined;
	if (field.relationshipInfo?.relatedField) {
		logger.trace('Loading with loadByRelatedId');

		// This should be typed as <gqlEntityType, relatedEntityType>
		dataEntities = await BaseLoaders.loadByRelatedId<R, D>({
			gqlEntityType,
			relatedField: field.relationshipInfo.relatedField as keyof D & string,
			id: String(source[sourcePrimaryKeyField]),
			filter: loaderFilter,
		});
	} else if (idValue) {
		logger.trace('Loading with loadOne');

		const idsToLoad = Array.isArray(idValue) ? idValue : [idValue];
		dataEntities = await Promise.all(
			idsToLoad.map((id) =>
				BaseLoaders.loadOne<R, D>({
					gqlEntityType,
					id: String(id),
					filter: loaderFilter,
				})
			)
		);
	}

	return dataEntities;
};
