import { SortColumn } from 'react-data-grid';
import { Entity, FieldFilter, Filter, SortField } from './use-schema';

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
	filters?: FieldFilter;
	page?: number;
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
	filters,
	page,
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

	return `/${chunks.join('/')}${encodeSearchParams({ sort, filters, page })}`;
};

// Stop '&' being always prepended to filter
interface EncodedParams {
	page?: number;
	sort?: string;
	filters?: string;
}

export const encodeSearchParams = (searchParams: SearchParams) => {
	const { sort, filters, page } = searchParams;
	let search = '';
	let encoded: EncodedParams = {};

	if (filters !== undefined) {
		// Remove all undefined attributes from the filters object as it borks the subsequent URL encoding logic
		Object.entries(filters).forEach(([key, value]) => {
			if (value === undefined) delete filters[key];
		});
	}
	if (sort && sort.length > 0) {
		encoded = { ...encoded, sort: encodeURIComponent(btoa(JSON.stringify(sort))) };
	}
	if (filters && Object.keys(filters).length > 0) {
		encoded = { ...encoded, filters: encodeURIComponent(btoa(JSON.stringify(filters))) };
	}
	if (page) {
		encoded = { ...encoded, page };
	}
	if (Object.keys(encoded).length > 0) {
		search =
			'?' +
			Object.entries(encoded)
				.map(([k, v]) => `${k}=${v}`)
				.join('&');
	}
	return search;
};

export const decodeSearchParams = (
	search: URLSearchParams
): {
	sort?: SortField[];
	filters?: FieldFilter;
	page: number;
} => {
	const rawSort = search.get('sort');
	const rawFilter = search.get('filters');
	const page = search.get('page') || undefined;
	return {
		sort: rawSort ? JSON.parse(atob(decodeURIComponent(rawSort))) : undefined,
		filters: rawFilter ? JSON.parse(atob(decodeURIComponent(rawFilter))) : undefined,
		page: page ? +page : 1,
	};
};
