import { DocumentNode, QueryOptions } from '@apollo/client';
import { isDocumentNode } from '@apollo/client/utilities';
import { Entity, Filter, getOrderByQuery, SortEntity } from '../utils';
import { listEntityForExport } from '../documents/export';

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
