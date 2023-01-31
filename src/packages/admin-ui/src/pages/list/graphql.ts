import { Entity, getEntity, getEntityPage } from '@exogee/graphweaver-admin-ui-components';
import { SortColumn } from 'react-data-grid';

export const fetchList = <T>(
	entity: string,
	entityByNameOrType: (entity: string) => Entity,
	sortColumns?: SortColumn[],
	page?: number
) => getEntityPage<T>(entityByNameOrType(entity), sortColumns || [], entityByNameOrType, page ?? 1);

export const fetchEntity = <T>(
	entity: string,
	entityByNameOrType: (entity: string) => Entity,
	id?: string
) => (id ? getEntity<T>(entityByNameOrType(entity), id) : undefined);
