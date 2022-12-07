import { Entity } from './use-schema';

interface RouteForEntity {
	entity: string | Entity;
	type?: undefined;
	dashboard?: undefined;
	id?: string;
}

interface RouteForType {
	type: string;
	entity?: undefined;
	dashboard?: undefined;
	id?: string;
}

interface RouteForDashboard {
	dashboard: string;
	entity?: undefined;
	type?: undefined;
	id?: string;
}

export type RouteForProps = RouteForEntity | RouteForType | RouteForDashboard;

const cleaningPattern = /[^a-zA-Z0-9]/g;

export const routeFor = ({ entity, dashboard, type, id }: RouteForProps) => {
	if (dashboard) return `/dashboard/${dashboard}`;

	let entityName = null;

	if (type) entityName = type.replaceAll(cleaningPattern, '');
	else if (typeof entity === 'string') entityName = entity;
	else entityName = entity?.name;

	const chunks = [entityName];
	if (id) chunks.push(id);
	return `/${chunks.join('/')}`;
};
