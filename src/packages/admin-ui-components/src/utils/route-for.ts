import { SortColumn } from 'react-data-grid';
import { Entity, Filter, SortField } from './use-schema';

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
	sort?: SortField[];
	filter?: Filter;
}

export type RouteForProps = (RouteForEntity | RouteForType | RouteForDashboard) & SearchParams;

const cleaningPattern = /[^a-zA-Z0-9]/g;

export const routeFor = ({
	entity,
	type,
	id,
	dashboard,
	tenantId,
	sort,
	filter,
}: RouteForProps) => {
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

	return `/${chunks.join('/')}${encodeSearchParams({ sort, filter })}`;
};

const encodeSearchParams = (searchParams: SearchParams) => {
	const { sort, filter } = searchParams;
	let search = '';
	let sortEncoded;
	let filterEncoded;
	if (sort && sort.length > 0) {
		sortEncoded = 'sort=' + encodeURIComponent(btoa(JSON.stringify(sort)));
	}
	if (filter) {
		filterEncoded = 'filter=' + encodeURIComponent(btoa(JSON.stringify(filter)));
	}
	if (sortEncoded || filterEncoded) {
		search = '?' + [sortEncoded, filterEncoded].join('&');
	}
	return search;
};

export const decodeSearchParams = (search: URLSearchParams) => {
	const result: Record<string, any> = {};
	const rawSort = search.get('sort');
	const rawFilter = search.get('filter');
	if (rawSort !== null) {
		// TODO: validate JSON
		result['sort'] = JSON.parse(atob(decodeURIComponent(rawSort)));
	}
	if (rawFilter !== null) {
		result['filter'] = JSON.parse(atob(decodeURIComponent(rawFilter)));
	}
	return result;
};
