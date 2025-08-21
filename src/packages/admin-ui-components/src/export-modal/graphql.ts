import { DocumentNode, gql, QueryOptions } from '@apollo/client';
import { isDocumentNode } from '@apollo/client/utilities';
import {
	AggregationType,
	Entity,
	Filter,
	generateGqlSelectForEntityFields,
	getOrderByQuery,
	SortEntity,
} from '../utils';

export const listEntityForExport = (
	entity: Entity,
	entityByType?: (entityType: string) => Entity
) => {
	const pluralName = entity.plural;
	const queryName = pluralName[0].toLowerCase() + pluralName.slice(1);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);

	return gql`
		query entityCSVExport($filter: ${pluralName}ListFilter, $pagination: ${pluralName}PaginationInput) {
			result: ${queryName}(filter: $filter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity.fields.filter((field) => !field.hideInTable), entityByType)}
			}
			${entityCanCount ? `aggregate: ${queryName}_aggregate(filter: $filter) { count }` : ''}
		}
	`;
};

export const defaultQuery = async ({
	selectedEntity,
	entityByName,
	queryOverride,
	pageNumber,
	pageSize,
	sort,
	filters,
}: {
	selectedEntity: Entity;
	entityByName: (entityType: string) => Entity;
	queryOverride:
		| DocumentNode
		| undefined
		| ((
				entity: Entity,
				entityByName: (entityType: string) => Entity
		  ) => Promise<DocumentNode | undefined> | DocumentNode | undefined);
	pageNumber: number;
	pageSize: number;
	sort?: SortEntity;
	filters?: Filter;
}): Promise<QueryOptions<any, any>> => {
	let query: DocumentNode | undefined;

	if (typeof queryOverride === 'function') {
		query = await queryOverride(selectedEntity, entityByName);
	} else if (isDocumentNode(queryOverride)) {
		query = queryOverride;
	} else if (typeof queryOverride !== 'undefined' && queryOverride !== null) {
		throw new Error('query must be a function or a DocumentNode for CSV export');
	}

	query ??= listEntityForExport(selectedEntity, entityByName);

	return {
		query,
		variables: {
			pagination: {
				offset: pageNumber * pageSize,
				limit: pageSize,
				orderBy: getOrderByQuery({
					primaryKeyField: selectedEntity.primaryKeyField,
					sort,
				}),
			},
			...(filters ? { filter: filters } : {}),
		},
		fetchPolicy: 'no-cache',
	};
};
