import { SortColumn } from 'react-data-grid';
import { Entity } from './use-schema';

interface RouteForEntity {
	entity: string | Entity;
	type?: undefined;
	dashboard?: undefined;
	id?: string;
	tenantId?: undefined;
}

interface RouteForType {
	type: string;
	entity?: undefined;
	dashboard?: undefined;
	id?: string;
	tenantId?: undefined;
}

interface RouteForDashboard {
	dashboard: string;
	entity?: undefined;
	type?: undefined;
	id?: string;
	tenantId?: string;
}

interface SearchParams {
	sort?: SortColumn[];
	// TODO: filter
}

export type RouteForProps = (RouteForEntity | RouteForType | RouteForDashboard) & SearchParams;

const cleaningPattern = /[^a-zA-Z0-9]/g;

export const routeFor = ({ entity, type, id, dashboard, tenantId, sort }: RouteForProps) => {
	if (dashboard) {
		const chunks = ['dashboard'];
		if (tenantId) chunks.push(tenantId);
		return `/${chunks.join('/')}`;
	}

	let entityName = null;

	if (type) entityName = type.replaceAll(cleaningPattern, '');
	else if (typeof entity === 'string') entityName = entity;
	else entityName = entity?.name;

	const chunks = [entityName];
	if (id) chunks.push(id);
	// TODO: At the moment, sorting is a simple '?name=asc&name=desc&...' string
	let search = '';
	if (sort && sort.length > 0) {
		search = '?' + sort.map((col) => `${col.columnKey}=${col.direction}`).join('&');
	}
	return `/${chunks.join('/')}${search}`;
};
