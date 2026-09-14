/**
 * The shape of the `_graphweaver` metadata the Admin UI runs on.
 *
 * These live apart from `use-schema.ts` so they can be imported without pulling in React,
 * Apollo Client or formik. The build needs them in plain Node when it enumerates the
 * documents the Admin UI can send, for trusted documents.
 */

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
	relationshipBehaviour?: 'load' | 'count';
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

export interface Filter<T = unknown> {
	[x: string]: T;
}
