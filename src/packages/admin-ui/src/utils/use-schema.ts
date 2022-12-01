import { useEffect, useMemo, useState } from 'react';
// import { request } from 'graphql-request';
import { useQuery } from '@apollo/client';
import { SCHEMA_QUERY } from './graphql';

export interface Entity {
	name: string;
	backendId: string;
	// TODO: Type so it matches one field name
	summaryField?: string;
	fields: EntityField[];
}

export interface EntityField {
	name: string;
	type: string;
	relationshipType?: '1:1' | '1:n' | 'm:1' | 'm:n';
}

export const useSchema = () => {
	const [schema, setSchema] = useState<Entity[]>([]);
	const { data } = useQuery(SCHEMA_QUERY);

	// Fetch the schema
	useEffect(() => {
		if (data && data._graphweaver && data._graphweaver.length) {
			setSchema(data._graphweaver.filter((entity: any) => entity.backendId));
		}
	}, [data]);

	// This is a map of backendId to a list of entities
	const dataSourceMap = useMemo(() => {
		const result: { [backendId: string]: Entity[] } = {};
		for (const entity of schema) {
			if (entity.backendId) {
				if (!result[entity.backendId]) result[entity.backendId] = [];

				result[entity.backendId].push(entity);
			}
		}
		return result;
	}, [schema]);

	// We already have an array of entities but we should pre-build a lookup by name.
	const entityMap = useMemo(() => {
		const result: { [entityName: string]: Entity } = {};
		for (const entity of schema) {
			if (entity.name) result[entity.name] = entity;
		}
		return result;
	}, [schema]);

	return {
		entities: Object.keys(entityMap),
		backends: Object.keys(dataSourceMap),
		entityByName: (entityName: string) => entityMap[entityName],
		entityByType: (entityType: string) => {
			const entityName = entityType.replaceAll(/[^a-zA-Z\d]/g, '');
			return entityMap[entityName];
		},
		entitiesForBackend: (backendId: string) => dataSourceMap[backendId],
		entityInBackend: (entityName: string, backendId: string) =>
			// TODO: This could be an O(1) lookup if we build one first.
			!!dataSourceMap[backendId].find((entity) => entity.name === entityName),
	};
};
