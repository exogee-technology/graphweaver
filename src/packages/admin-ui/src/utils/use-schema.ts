import { useMemo } from 'react';
import { schema } from './stub-data';

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
	};
};
