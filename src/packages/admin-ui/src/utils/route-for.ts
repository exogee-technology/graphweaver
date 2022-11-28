import { Entity } from './use-schema';

interface RouteForEntity {
	entity: string | Entity;
	type?: undefined;
	id?: string;
}

interface RouteForType {
	type: string;
	entity?: undefined;
	id?: string;
}

export type RouteForProps = RouteForEntity | RouteForType;

const cleaningPattern = /[^a-zA-Z0-9]/g;

export const routeFor = ({ entity, type, id }: RouteForProps) => {
	let entityName = null;

	if (type) entityName = type.replaceAll(cleaningPattern, '');
	else if (typeof entity === 'string') entityName = entity;
	else entityName = entity?.name;

	const chunks = [entityName];
	if (id) chunks.push(id);
	return `/${chunks.join('/')}`;
};
