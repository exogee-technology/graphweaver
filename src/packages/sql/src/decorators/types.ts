import type { ColumnMeta, ColumnType } from '../ir/nodes';

/** Where we stash storage metadata on a Graphweaver field. Namespaced, per the core convention. */
export const SQL_STORAGE = 'sqlStorage';

export interface PivotSpec {
	table: string;
	schema?: string;
	/** The pivot column pointing back at the entity declaring the relationship. */
	joinColumn: string;
	/** The pivot column pointing at the related entity. */
	inverseJoinColumn: string;
}

export interface SqlColumnStorage {
	kind: 'column';
	column?: string;
	type?: ColumnType;
	/** Array encoding, decimal precision and the like. */
	meta?: ColumnMeta;
	/** How the database produces the value, which decides whether we write the column at all. */
	generated?: 'identity' | 'always' | 'default' | false;
}

export interface SqlManyToOneStorage {
	kind: 'manyToOne';
	/** The foreign key column, which lives on this entity's table. */
	column?: string;
}

export interface SqlOneToManyStorage {
	kind: 'oneToMany';
	relatedField: string;
}

export interface SqlManyToManyStorage {
	kind: 'manyToMany';
	/** The owning side declares the pivot. */
	through?: PivotSpec;
	/** The inverse side names the owning field instead. */
	relatedField?: string;
}

export interface SqlUnmappedStorage {
	kind: 'unmapped';
}

export type SqlFieldStorage =
	| SqlColumnStorage
	| SqlManyToOneStorage
	| SqlOneToManyStorage
	| SqlManyToManyStorage
	| SqlUnmappedStorage;

/** A column that exists in the database but not in the GraphQL schema. */
export interface HiddenColumnDefinition {
	type: ColumnType;
	meta?: ColumnMeta;
	column?: string;
	nullable?: boolean;
	/**
	 * Defaults to true. Set false for secrets and large values: the column stays filterable,
	 * because a WHERE clause never needs a column in the SELECT list, but it is not loaded unless
	 * a query asks for it via `withColumns`.
	 */
	select?: boolean;
	generated?: 'identity' | 'always' | 'default' | false;
}

export type HiddenColumns<H> = { [K in keyof H]-?: HiddenColumnDefinition };
