import {
	Entity,
	Filter,
	getEntity,
	getEntityPage,
	SortField,
} from '@exogee/graphweaver-admin-ui-components';
import { SortColumn } from 'react-data-grid';

export const fetchList = <T>(
	entity: string,
	entityByNameOrType: (entity: string) => Entity,
	filterField?: Filter,
	sortFields?: SortField[],
	page?: number
) =>
	getEntityPage<T>(
		entityByNameOrType(entity),
		filterField || {},
		sortFields || [],
		entityByNameOrType,
		page ?? 1
	);

export const fetchEntity = <T>(
	entity: string,
	entityByNameOrType: (entity: string) => Entity,
	id?: string
) => (id ? getEntity<T>(entityByNameOrType(entity), id) : undefined);
