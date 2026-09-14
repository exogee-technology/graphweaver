import { InMemoryCache, useQuery } from '@apollo/client';
import { generateTypePolicies } from '@exogee/graphweaver-apollo-client';
import { JSX, useEffect, useMemo } from 'react';

import { FieldHelperProps, FieldMetaProps } from 'formik';
import { PanelMode } from '../detail-panel';
import { SCHEMA_QUERY } from '../documents/select';
import { Entity, Enum, EntityField, Schema } from './schema-types';

export interface CustomFieldArgs<T = unknown, F = unknown> {
	entity: T;
	context: 'table' | 'detail-form';
	panelMode: PanelMode;
	formik?: {
		meta: FieldMetaProps<F>;
		helpers: FieldHelperProps<F>;
	};
}

export interface CustomField<T = unknown> extends EntityField {
	index?: number;
	type: 'custom';

	component: (args: CustomFieldArgs<T>) => JSX.Element | null;
	hideInDetailForm?: boolean;
	panelMode?: PanelMode;
}

// These two are deprecated and should be removed in the future.

type EntityMap = {
	[entityName: string]: Entity;
};

export const useSchema = () => {
	const { data, loading, error, client } = useQuery<{ result: Schema }>(SCHEMA_QUERY);

	// Add type policies to the Apollo cache so that our entities are handled correctly.
	useEffect(() => {
		if (!data?.result?.entities) return;

		// Now we have our entities we can create the type policies which tell Apollo
		// what our primary keys are, how to handle collections, etc.
		const typePolicies = generateTypePolicies(data.result.entities);
		(client.cache as InMemoryCache).policies.addTypePolicies(typePolicies);
	}, [client.cache, data?.result?.entities]);

	// This is a map of backendId to a list of entities
	const dataSourceMap = useMemo(() => {
		const result: { [backendId: string]: { displayName: string; entities: Entity[] } } = {};
		if (!data?.result?.entities) return result;

		for (const entity of data.result.entities) {
			if (entity.backendId) {
				if (!result[entity.backendId]) {
					result[entity.backendId] = {
						displayName: entity.backendDisplayName ?? entity.backendId,
						entities: [],
					};
				}

				result[entity.backendId].entities.push(entity);
			}
		}
		return result;
	}, [data]);

	// We already have an array of entities but we should pre-build a lookup by name.
	const entityMap = useMemo(() => {
		const result: EntityMap = {};
		if (!data?.result?.entities) return result;

		for (const entity of data.result.entities) {
			if (entity.name) result[entity.name] = entity;
		}

		return result;
	}, [data]);

	const enumMap = useMemo(() => {
		const result: { [enumName: string]: Enum } = {};
		if (!data?.result?.enums) return result;

		for (const registeredEnum of data.result.enums) {
			result[registeredEnum.name] = registeredEnum;
		}
		return result;
	}, [data]);

	return {
		loading,
		error,
		entities: Object.keys(entityMap),
		backends: Object.keys(dataSourceMap),
		entityByName: (entityName: string) => entityMap[entityName],
		entityByType: (entityType: string) => {
			const entityName = entityType.replaceAll(/[^a-zA-Z\d]/g, '');
			return entityMap[entityName];
		},
		enumByName: (enumName: string) => enumMap[enumName],
		displayNameForBackend: (backendId: string) => dataSourceMap[backendId].displayName,
		entitiesForBackend: (backendId: string) => dataSourceMap[backendId].entities,
		backendDisplayNames: Array.from(
			new Set(Object.values(dataSourceMap).map((dataSource) => dataSource.displayName))
		).sort(),
		backendIdsForDisplayName: (backendDisplayName: string) => {
			const backendIds = new Set<string>();

			for (const backendId of Object.keys(dataSourceMap)) {
				if (dataSourceMap[backendId].displayName === backendDisplayName) {
					backendIds.add(backendId);
				}
			}

			return backendIds;
		},
		entitiesForBackendDisplayName: (backendDisplayName: string) => {
			const entities = [];

			for (const backendId of Object.keys(dataSourceMap)) {
				if (dataSourceMap[backendId].displayName === backendDisplayName) {
					entities.push(...dataSourceMap[backendId].entities);
				}
			}

			return entities;
		},
	};
};
