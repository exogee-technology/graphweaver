import type { ColumnMeta, ColumnType } from '../ir/nodes';
import { byCodeUnit } from '../order';

/**
 * The resolved mapping the query planner reads.
 *
 * In the finished package this is built from Graphweaver's own `EntityMetadata` plus the naming
 * strategy and any overrides. For the spike it's hand-built in the test fixtures, because the
 * question the spike answers is about filter translation, not about metadata resolution.
 */

export interface ResolvedColumn {
	/** The property name on the entity, which is what filters refer to. */
	property: string;
	/** The column name in the database. */
	name: string;
	type: ColumnType;
	/** Drives whether ORDER BY needs to say anything about NULLs at all. */
	nullable: boolean;

	/** How the database produces the value, which decides whether we ever write this column. */
	generated?: 'identity' | 'always' | 'default' | false;

	/**
	 * Defaults to true. A column with `select: false` stays filterable -- WHERE never needs a
	 * column in the SELECT list -- but is only loaded when a query asks for it.
	 */
	select?: boolean;

	/** True for columns declared in the storage interface rather than the GraphQL entity. */
	hidden?: boolean;

	/** Precision, array encoding and so on, where the type alone does not say enough. */
	meta?: ColumnMeta;
}

export interface PivotRef {
	schema?: string;
	table: string;
	/** The pivot column pointing back at the entity that declares this relationship. */
	joinColumn: string;
	/** The pivot column pointing at the related entity. */
	inverseJoinColumn: string;
}

export interface ResolvedManyToOne {
	kind: 'manyToOne';
	property: string;
	/** The foreign key column, which lives on this entity's table. */
	foreignKey: ResolvedColumn;
	target: () => ResolvedEntity;
}

export interface ResolvedOneToMany {
	kind: 'oneToMany';
	property: string;
	target: () => ResolvedEntity;
	/** The foreign key column on the *other* table that points back at us. */
	targetForeignKey: () => ResolvedColumn;
}

export interface ResolvedManyToMany {
	kind: 'manyToMany';
	property: string;
	target: () => ResolvedEntity;
	pivot: PivotRef;
}

export type ResolvedRelationship = ResolvedManyToOne | ResolvedOneToMany | ResolvedManyToMany;

export interface ResolvedEntity {
	name: string;
	schema?: string;
	table: string;
	primaryKey: ResolvedColumn;
	/** Keyed by property name. Includes hidden columns, which is what makes them filterable. */
	columns: Map<string, ResolvedColumn>;
	/** Keyed by property name. */
	relationships: Map<string, ResolvedRelationship>;
}

/** Every column a default SELECT should load: everything except the `select: false` ones. */
export const defaultSelectColumns = (entity: ResolvedEntity) =>
	[...entity.columns.values()].filter((column) => column.select !== false);

export class UnknownFieldError extends Error {
	constructor(
		public readonly entityName: string,
		public readonly field: string,
		known: string[]
	) {
		super(
			`Could not locate '${field}' on entity '${entityName}'. Known fields are: ${known
				.sort(byCodeUnit)
				.join(', ')}.`
		);
		this.name = 'UnknownFieldError';
	}
}
