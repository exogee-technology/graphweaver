import { useMemo } from 'react';
import { ApolloCache, TypePolicy, useQuery } from '@apollo/client';
import { SCHEMA_QUERY } from './graphql';
import pluralize from 'pluralize';
import { PanelMode } from '../detail-panel';

export interface Schema {
	entities: Entity[];
	enums: Enum[];
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
	backendId: string;
	// TODO: Type so it matches a field name on the entity instead of just string.
	summaryField?: string;
	fields: EntityField[];
	defaultFilter: FieldFilter;
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

export type EntityFieldType =
	| 'Boolean'
	| 'custom'
	| 'ID!'
	| 'ID'
	| 'JSON'
	| 'Image'
	| 'Media'
	| 'Number';

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
}

export interface CustomField<T = unknown> extends EntityField {
	index?: number;
	type: 'custom';

	component: (args: CustomFieldArgs<T>) => JSX.Element;

	hideOnTable?: boolean;
	hideOnDetailForm?: boolean;
	panelMode?: PanelMode;
}

// @todo this needs typing correctly

export interface FieldFilter {
	[x: string]: Filter | undefined;
}

export interface Filter<T = unknown> {
	[x: string]: T;
}

type SortDirection = 'ASC' | 'DESC';

export interface SortField {
	field: string;
	direction: SortDirection;
}

type Cache = ApolloCache<unknown> & {
	policies: { addTypePolicies: (policy: { Query: TypePolicy }) => void };
};

type EntityMap = {
	[entityName: string]: Entity;
};

const generateTypePolicyFields = (entityMap: EntityMap) => {
	const policy = {
		keyArgs: (
			args: {
				filter?: Record<string, unknown>;
				pagination?: { orderBy: Record<string, unknown> };
			} | null
		) => {
			// https://www.apollographql.com/docs/react/pagination/key-args/#keyargs-function-advanced
			const filter = args?.filter ? JSON.stringify(args.filter) : '';
			const orderBy = args?.pagination?.orderBy ? JSON.stringify(args.pagination.orderBy) : '';
			return btoa(`${filter}:${orderBy}`);
		},
		merge(existing = [], incoming: { __ref: string }[]) {
			const merged = [...existing, ...incoming];
			const uniqueItems = new Set(merged.map((item) => item.__ref));
			return [...uniqueItems].map((__ref) => merged.find((item) => item.__ref === __ref));
		},
	};

	const mapEntityToPolicy = (entity: Entity) => ({
		[pluralize(entity.name).toLowerCase()]: policy,
	});

	return {
		...Object.values(entityMap)
			.map(mapEntityToPolicy)
			.reduce((acc, policy) => ({ ...acc, ...policy }), {}),
	};
};

export const useSchema = () => {
	const { data, loading, error, client } = useQuery<{ result: Schema }>(SCHEMA_QUERY);
	const cache = client.cache as Cache;

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
		const result: { [entityName: string]: Entity } = {};
		if (!data?.result?.entities) return result;

		for (const entity of data.result.entities) {
			if (entity.name) result[entity.name] = entity;
		}

		// Now we have our entities we can create the type policy
		const typePolicy: { Query: TypePolicy } = {
			Query: {
				keyFields: ['id'], // This is the default and is here for clarity
				fields: generateTypePolicyFields(result),
			},
		};
		cache.policies.addTypePolicies(typePolicy);

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
		entitiesForBackend: (backendId: string) => dataSourceMap[backendId],
		entityInBackend: (entityName: string, backendId: string) =>
			// TODO: This could be an O(1) lookup if we build one first.
			!!dataSourceMap[backendId].find((entity) => entity.name === entityName),
	};
};
