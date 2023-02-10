import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { SCHEMA_QUERY } from './graphql';

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
}

export interface EntityField {
	name: string;
	type: string;
	relationshipType?: '1:1' | '1:n' | 'm:1' | 'm:n';
}

export interface Filter {
	filter?: FieldPredicate;
}

interface FieldEquals {
	kind: 'equals';
	field: string;
	value: string;
}

interface FieldLike {
	kind: '_like';
	field: string;
	pattern: string;
	isCaseInsensitive: boolean;
}

interface FieldGreaterThan {
	kind: '_gt';
	field: string;
	value: string;
}

interface FieldLessThan {
	kind: '_lt';
	field: string;
	value: string;
}

interface FieldGreaterThanOrEqualTo {
	kind: '_gte';
	field: string;
	value: string;
}

interface FieldLessThanOrEqualTo {
	kind: '_lte';
	field: string;
	value: string;
}

interface FieldAnd {
	kind: '_and';
	and: FieldPredicate[];
}

interface FieldOr {
	kind: '_or';
	or: FieldPredicate[];
}

// @todo: These are the ones currently supported by the Xero backend provider
export type FieldPredicate =
	| FieldEquals
	| FieldLike
	| FieldAnd
	| FieldOr
	| FieldGreaterThan
	| FieldLessThan
	| FieldGreaterThanOrEqualTo
	| FieldLessThanOrEqualTo; // | FieldNot | in, isNull, isTrue between, etc

type SortDirection = 'ASC' | 'DESC';

export interface SortField {
	field: string;
	direction: SortDirection;
}

export const useSchema = () => {
	const { data, loading, error } = useQuery<{ result: Schema }>(SCHEMA_QUERY);

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
