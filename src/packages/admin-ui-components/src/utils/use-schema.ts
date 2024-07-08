import { useEffect, useMemo } from 'react';
import { InMemoryCache, useQuery } from '@apollo/client';
import { generateTypePolicies } from '@exogee/graphweaver-apollo-client';

import { SCHEMA_QUERY } from './graphql';
import { PanelMode } from '../detail-panel';

export interface Schema {
	entities: Entity[];
	enums: Enum[];
	federationSubgraphName?: string;
}

export interface Enum {
	name: string;
	values: Array<{
		name: string;
		value: string;
	}>;
}
export interface Entity {
	name: string;
	plural: string;
	backendId: string;
	primaryKeyField: string;
	// TODO: Type so it matches a field name on the entity instead of just string.
	summaryField?: string;
	supportedAggregationTypes: AggregationType[];
	fields: EntityField[];
	defaultFilter?: Filter;
	attributes: EntityAttributes;
}

export enum AdminUIFilterType {
	DATE_RANGE = 'DATE_RANGE',
	ENUM = 'ENUM',
	NUMERIC = 'NUMERIC',
	RELATIONSHIP = 'RELATIONSHIP',
	TEXT = 'TEXT',
	BOOLEAN = 'BOOLEAN',
}

export enum AggregationType {
	COUNT = 'COUNT',
}

// The 'string' case is another entity name
export type EntityFieldType =
	| string
	| 'Boolean'
	| 'custom'
	| 'ID!'
	| 'ID'
	| 'JSON'
	| 'Image'
	| 'Media'
	| 'Number'
	| 'String';

export interface EntityField {
	name: string;
	type: EntityFieldType;
	isArray?: boolean;
	relationshipType?: 'MANY_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_MANY' | 'ONE_TO_ONE';
	filter?: {
		type: AdminUIFilterType;
	};
	attributes?: EntityFieldAttributes;
	initialValue?: string | number | boolean;
	extensions?: {
		key: string;
	};
}

export interface EntityFieldAttributes {
	isReadOnly: boolean;
	isRequired: boolean;
}

export interface EntityAttributes {
	isReadOnly?: boolean;
	exportPageSize?: number;
}

export interface CustomFieldArgs<T = unknown> {
	entity: T;
	context: 'table' | 'detail-form';
	panelMode: PanelMode;
	federationSubgraphName?: string;
}

export interface CustomField<T = unknown> extends EntityField {
	index?: number;
	type: 'custom';

	component: (args: CustomFieldArgs<T>) => JSX.Element;

	hideOnTable?: boolean;
	hideOnDetailForm?: boolean;
	panelMode?: PanelMode;
}

export interface Filter<T = unknown> {
	[x: string]: T;
}

type SortDirection = 'ASC' | 'DESC';

export interface SortField {
	field: string;
	direction: SortDirection;
}

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
		const result: { [backendId: string]: Entity[] } = {};
		if (!data?.result?.entities) return result;

		for (const entity of data.result.entities) {
			if (entity.backendId) {
				if (!result[entity.backendId]) result[entity.backendId] = [];

				result[entity.backendId].push(entity);
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
		federationSubgraphName: data?.result?.federationSubgraphName,
		entityByName: (entityName: string) => entityMap[entityName],
		entityByType: (entityType: string) => {
			const entityName = entityType.replaceAll(/[^a-zA-Z\d]/g, '');
			return entityMap[entityName];
		},
		enumByName: (enumName: string) => enumMap[enumName],
		entitiesForBackend: (backendId: string) => dataSourceMap[backendId],
	};
};
