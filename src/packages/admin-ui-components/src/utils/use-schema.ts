import { InMemoryCache, useQuery } from '@apollo/client';
import { generateTypePolicies } from '@exogee/graphweaver-apollo-client';
import { JSX, useEffect, useMemo } from 'react';

import { FieldHelperProps, FieldMetaProps } from 'formik';
import { PanelMode } from '../detail-panel';
import { SCHEMA_QUERY } from './graphql';

export interface Schema {
	entities: Entity[];
	enums: Enum[];
}

export enum Sort {
	ASC = 'ASC',
	DESC = 'DESC',
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
	backendId?: string;
	backendDisplayName?: string;
	primaryKeyField: string;
	// TODO: Type so it matches a field name on the entity instead of just string.
	summaryField?: string;
	fieldForDetailPanelNavigationId: string;
	supportedAggregationTypes: AggregationType[];
	supportsPseudoCursorPagination: boolean;
	fields: EntityField[];
	defaultFilter?: Filter;
	defaultSort?: SortEntity;
	attributes: EntityAttributes;
	hideInSideBar: boolean;
	excludeFromTracing?: boolean;
}

export type SortEntity = Record<string, Sort>;

export enum AdminUIFilterType {
	DATE_RANGE = 'DATE_RANGE',
	DATE_TIME_RANGE = 'DATE_TIME_RANGE',
	ENUM = 'ENUM',

	/** Default for numbers - shows simple numeric input */
	NUMERIC = 'NUMERIC',

	/** Shows a range to filter by a range from and to a number. */
	NUMERIC_RANGE = 'NUMERIC_RANGE',
	RELATIONSHIP = 'RELATIONSHIP',
	TEXT = 'TEXT',
	BOOLEAN = 'BOOLEAN',
	DROP_DOWN_TEXT = 'DROP_DOWN_TEXT',
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
	| 'GraphweaverMedia'
	| 'Number'
	| 'String'
	| 'BigInt'
	| 'NanoTimestamp'
	| 'NanoDuration';

export enum DetailPanelInputComponentOption {
	TEXT = 'TEXT',
	RICH_TEXT = 'RICH_TEXT',
	MARKDOWN = 'MARKDOWN',
}

export interface DetailPanelInputComponent {
	name: DetailPanelInputComponentOption;
	options?: Record<string, unknown>;
}

export type DateTimeFormat =
	| 'DATETIME_FULL'
	| 'DATETIME_FULL_WITH_SECONDS'
	| 'DATETIME_HUGE'
	| 'DATETIME_HUGE_WITH_SECONDS'
	| 'DATETIME_MED'
	| 'DATETIME_MED_WITH_SECONDS'
	| 'DATETIME_MED_WITH_WEEKDAY'
	| 'DATETIME_SHORT'
	| 'DATETIME_SHORT_WITH_SECONDS'
	| 'DATE_FULL'
	| 'DATE_HUGE'
	| 'DATE_MED'
	| 'DATE_MED_WITH_WEEKDAY'
	| 'DATE_SHORT'
	| 'TIME_24_SIMPLE'
	| 'TIME_24_WITH_LONG_OFFSET'
	| 'TIME_24_WITH_SHORT_OFFSET'
	| 'TIME_24_WITH_SECONDS'
	| 'TIME_WITH_LONG_OFFSET'
	| 'TIME_WITH_SHORT_OFFSET'
	| 'TIME_SIMPLE'
	| 'TIME_WITH_SECONDS';

export type CellFormatOptions =
	| {
			type: 'date';
			timezone?: 'UTC' | 'local' | string;
			format?: DateTimeFormat;
	  }
	| {
			type: 'currency';
			variant: 'AUD' | 'GBP' | 'USD' | 'JPY' | 'EUR' | 'CHF' | 'THB' | 'IDR' | string;
	  };

export interface EntityField {
	name: string;
	type: EntityFieldType;
	isArray?: boolean;
	relationshipType?: 'MANY_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_MANY' | 'ONE_TO_ONE';
	filter?: {
		type: AdminUIFilterType;
		options?: Record<string, unknown>;
	};
	attributes?: EntityFieldAttributes;
	initialValue?: string | number | boolean;
	format?: CellFormatOptions;
	extensions?: {
		key: string;
	};
	hideInTable?: boolean;
	hideInFilterBar?: boolean;
	hideInDetailForm?: boolean;
	detailPanelInputComponent?: DetailPanelInputComponent;
}

export interface EntityFieldAttributes {
	isReadOnly: boolean;
	isRequiredForCreate: boolean;
	isRequiredForUpdate: boolean;
}

export interface EntityAttributes {
	isReadOnly?: boolean;
	exportPageSize?: number;
	clientGeneratedPrimaryKeys?: boolean;
}

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

export interface Filter<T = unknown> {
	[x: string]: T;
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
