import { gql } from '@apollo/client';
import pluralize from 'pluralize';

import { Entity, FieldPredicate, Filter, SortField } from './use-schema';
// Can't use useApolloClient/useQuery/useParms here if not using Loader
import { apolloClient } from '../apollo';

export const PAGE_SIZE = 50;

export const getEntityPage = <T>(
	entity: Entity,
	filterField: Filter,
	sortFields: readonly SortField[],
	entityByType: (type: string) => Entity,
	page: number
) => {
	const query = queryForEntityPage(entity, entityByType);

	const filter: Record<string, any> = convertFilter(filterField.filter);
	const orderBy: { [field: string]: 'ASC' | 'DESC' } = {};

	for (const sortColumn of sortFields) {
		orderBy[sortColumn.field] = sortColumn.direction;
	}

	return apolloClient.query<T>({
		query,
		variables: {
			filter,
			pagination: {
				offset: Math.max(page - 1, 0) * PAGE_SIZE,
				limit: PAGE_SIZE,
				orderBy,
			},
		},
	});
};

const queryForEntityPage = (entity: Entity, entityByType: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThings.
	const pluralName = pluralize(entity.name);
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);

	// TODO: Is there a better way to build this than a big string?
	//
	// We looked into generating an AST here but it's really verbose and
	// doesn't seem that much cleaner than just generating a string.
	return gql`
		query AdminUIListPage($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${entity.fields
					.map((field) => {
						if (field.relationshipType) {
							const relatedEntity = entityByType(field.type);
							return `${field.name} { id ${relatedEntity.summaryField || ''} }`;
						} else {
							return field.name;
						}
					})
					.join(' ')}
			}
		}
	`;
};

export const getEntity = <T>(entity: Entity, id: string, entityByType?: (type: string) => Entity) =>
	apolloClient.query<T>({
		query: queryForEntity(entity, entityByType),
		variables: { id },
	});

const queryForEntity = (entity: Entity, entityByType?: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThing.
	const queryName = entity.name[0].toLowerCase() + entity.name.slice(1);

	// TODO: Is there a better way to build this than a big string?
	//
	// We looked into generating an AST here but it's really verbose and
	// doesn't seem that much cleaner than just generating a string.
	return gql`
		query AdminUIDetail($id: ID!) {
			result: ${queryName}(id: $id) {
				${entity.fields
					.map((field) => {
						if (field.relationshipType) {
							if (!entityByType) {
								return `${field.name} { id }`;
							}
							const relatedEntity = entityByType(field.type);
							return `${field.name} { id ${relatedEntity.summaryField || ''} }`;
						} else {
							return field.name;
						}
					})
					.join(' ')}
			}
		}
	`;
};

const convertFilter = (inFilter?: FieldPredicate): Record<string, any> => {
	// Convert to filiter format used by backend:
	// '_and'|'_or' -> {[pred]: [...]}
	// 'equals': -> {[fieldName]: value}
	// '_lt'|'_lte'|'_gt'|'_gte': -> {[fieldName + pred]: value}
	if (!inFilter) {
		return {};
	}
	switch (inFilter.kind) {
		case '_and':
			return { ['_and']: inFilter.and.map(convertFilter) };
		case '_or':
			return { ['_or']: inFilter.or.map(convertFilter) };
		case '_gt':
		case '_gte':
		case '_lt':
		case '_lte':
			return { [inFilter.field + inFilter.kind]: inFilter.value };
		case 'equals':
			return { [inFilter.field]: inFilter.value };
		default:
			return {};
		// case '_like' not implemented
	}
};
